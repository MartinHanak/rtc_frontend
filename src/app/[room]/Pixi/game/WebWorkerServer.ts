// 
//  Web Worker file
//

// specific pixi.js settings for webworker
// ADAPTER settings has to be set to OffscreenCanvas
import { settings, IAdapter } from "pixi.js";

const WebWorkerAdapter = {
  createCanvas: (width: number, height: number) => new OffscreenCanvas(width | 0, height | 0),
  getCanvasRenderingContext2D: () => OffscreenCanvasRenderingContext2D,
  getWebGLRenderingContext: () => WebGLRenderingContext,
  getNavigator: () => navigator,
  getBaseUrl: () => globalThis.location.href,
  // @ts-ignore
  getFontFaceSet: () => globalThis.fonts,
  fetch: (url, options) => fetch(url, options),
  parseXML: (xml) => {
    const parser = new DOMParser();
    return parser.parseFromString(xml, "text/xml");
  }
} as IAdapter;
settings.ADAPTER = WebWorkerAdapter;

// other imports can use non-webworker specific imports
// all environment specific calls go through the adapter
import { Sprite } from "pixi.js";
import { EntityServerInput } from "../entity/Entity";
import { pointInput } from "../object/Map";
import { Map as GameMap } from "../object/Map";
import { Game } from "./Game";
import { Npc } from "../entity/Npc";
import { Player } from "../entity/Player";
import { ArrayBufferBuffer } from "./ArrayBufferBuffer";
import { HighResolutionTimer } from "@/app/util/HighResolutionTimer";



let server: WebWorkerServer | null = null;

export interface ServerInitializationData  {
    mapBoundaryPoint: pointInput[]
    localPlayerId: string,
    entities:  EntityServerInput[]
        
}

self.addEventListener('message', serverInitialization);

function serverInitialization(e: MessageEvent<ServerInitializationData>) {

    try {
        server = new WebWorkerServer(e.data);
        self.postMessage('Web worker server created successfully.');
        self.removeEventListener('message', serverInitialization);
    } catch (err) {
        throw new Error(`Error while creating a web worker server`);
    }
}

class WebWorkerServer {
    private tickRate: number = 10; // tickRate = ticks per second 

    get msPerTick() {
        return Math.floor(1000/this.tickRate);
    }
    // server does several game updates in one tick = to simulate approx. 60 FPS
    // for tickRate 10 there will be 6 steps in one tick
    get stepsInOneTick() {
        return Math.max(1, Math.round(60 / this.tickRate));
    }

    private timer: HighResolutionTimer;
    private playerIds: string[];
    private playerCommands: Record<string, ArrayBufferBuffer>;

    private currentTickCommands: Record< string, (ArrayBuffer|null)[] >;

    private game: Game;
    
    constructor(data: ServerInitializationData) {

        const gameMap = new GameMap(data.mapBoundaryPoint, new Sprite());
        const players : Player[] = [];
        const npcs : Npc[] = [];
        this.playerIds = [];

        for(const entityInput of data.entities) {
            if(entityInput.type === 'player') {

                players.push(
                    new Player(entityInput.id,entityInput.name, new Sprite())
                );
                this.playerIds.push(entityInput.id);

            } else if(entityInput.type === 'npc') {

                npcs.push(
                    new Npc(entityInput.id, entityInput.name, new Sprite())
                );

            }
        }

        this.game = new Game(
            gameMap,
            data.localPlayerId,
            players,
            npcs
        );

        this.playerCommands = {};
        for(const playerId of this.playerIds) {
           this.playerCommands[playerId] = new ArrayBufferBuffer();
        }

        this.currentTickCommands = {}
        for(const playerId of this.playerIds) {
            this.currentTickCommands[playerId] = [];
        }

        this.start();
    }

    public start() {
        let firstGameStateSent = false;
        let startGameProgress = false;
        let previousIntervalTime = Date.now();

        const initialServerDelay = this.msPerTick * 1.5;


        this.timer = new HighResolutionTimer(this.msPerTick, () => {
            let newTime = Date.now();
            let tickTime = newTime - previousIntervalTime;
            let stepTime = tickTime / this.stepsInOneTick;
            previousIntervalTime = newTime;
            self.postMessage(`Web worker tick time: ${tickTime}`);

            // send first game state after receiving enough (empty) commands from all players
            if(!firstGameStateSent) {

                firstGameStateSent = true;
                for(const playerId in this.playerCommands) {
                    if(this.playerCommands[playerId].bufferLength < 10) {
                        firstGameStateSent = false;
                        break;
                    }
                }
                if(firstGameStateSent) {
                    // send the first game state = initial game state, time 0
                    // old: this.messenger.sendGameState(this.currentGame.toArrayBuffer())
                    const initialState = this.game.toArrayBuffer();
                    self.postMessage(initialState, [initialState]);
                }
            } else if (firstGameStateSent && !startGameProgress) {
                // wait for commands from all players for the first server tick
                // only then start the game progress from 0
                startGameProgress = true;
                for(const playerId in this.playerCommands) {
                    if(!this.playerCommands[playerId].lastInsertedTime) {
                        startGameProgress = false;
                        break;
                    } else if (this.playerCommands[playerId].lastInsertedTime! < initialServerDelay) {
                        startGameProgress = false;
                        break;
                    }
                }
            }


            // start sending game state
            if(startGameProgress && firstGameStateSent) {

                // read command buffers
                // split commands into steps for all players
                this.updateCurrentTickCommands(
                    this.game.time,
                    this.game.time + tickTime,
                    this.stepsInOneTick
                )
                // test
                /*
                console.log(`Server time: ${this.game.time}`);
                for(const playerId in this.currentTickCommands) {
                    console.log(this.currentTickCommands[playerId])
                }
                */

                for(let step = 0; step < this.stepsInOneTick; step++) {
                    // apply commands to current game (and current time window)
                    for(const playerId in this.currentTickCommands) {
                        // if no command = no update (uses previous player command instead)
                        let command = this.currentTickCommands[playerId][step];
                        if(command) {
                            console.log(`Command found for current step.`)
                            let player = this.game.getEntity(playerId)
                            if(player instanceof Player) {
                                player.updateCurrentCommandFromArrayBuffer(command);
                                player.applyCurrentCommand(this.game.time);
                            } else {
                                console.log(`No player with id ${playerId} found.`);
                            }
                        } else {
                            console.log(`No command found for current step.`);
                        }
                    }
                    // progress game given the commands
                    this.game.progressGameState(stepTime);
                    // LATER: save a new game state (with updated simulation time) 
                }
                // remove them from buffer
                this.forgetCommandsUntil(this.game.time);
                // send new game state to all participants
                const gameState = this.game.toArrayBuffer();
                self.postMessage(gameState, [gameState]);

            } else if( !startGameProgress && firstGameStateSent ) {
                // send game state without progressing the game
                // UDP connection: 1st game state might not have arrived
                const initialGameState = this.game.toArrayBuffer();
                self.postMessage(initialGameState,[initialGameState]);
            }

        })

        // start the server loop
        this.timer.run();
        
    }



    private forgetCommandsUntil(time: number) {

        for(const playerId in this.playerCommands) {
            this.playerCommands[playerId].removeValuesUpto(time);
        }

    }

    private updateCurrentTickCommands(startTime: number, endTime: number, steps: number) {

        for(const playerId in this.currentTickCommands) {
            this.currentTickCommands[playerId] = this.playerCommands[playerId].getValuesWithinWindow(startTime,endTime,steps)
        }

    }

    public stop() {
        this.timer.stop();
    }
}

