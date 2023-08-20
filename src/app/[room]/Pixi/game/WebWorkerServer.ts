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

    server = new WebWorkerServer(e.data);

    // if success: remove event listener
    if(server) {
        self.postMessage('Web worker server created successfully.')
        self.removeEventListener('message', serverInitialization)
    } else {
        throw new Error(`Error while creating a web worker server`);
    }
}

class WebWorkerServer {
    private tickRate: number = 10; // tickRate per second update

    get msPerTick() {
        return Math.floor(1000/this.tickRate);
    }
    // server does several game updates in one tick = to simulate approx. 60 FPS
    get stepsInOneTick() {
        return Math.max(1, Math.round(60 / this.tickRate));
    }

    private intervalId : number;
    private playerIds: string[];
    private playerCommands: Record<string, ArrayBufferBuffer>;

    private currentTickCommands: Record< string, (ArrayBuffer|null)[] >

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


        const testTimer = new HighResolutionTimer(this.msPerTick, () => {
            let newTime = Date.now();
            let tickTime = newTime - previousIntervalTime;
            let stepTime = tickTime / this.stepsInOneTick;
            previousIntervalTime = newTime;
            self.postMessage(`Web worker tick time: ${tickTime}`);

            // rest of the code...
        })

        testTimer.run();
        
        /*
        self.setInterval(() => {
            let newTime = Date.now();
            let tickTime = newTime - previousIntervalTime;
            let stepTime = tickTime / this.stepsInOneTick;
            previousIntervalTime = newTime;
            self.postMessage(`Web worker tick time: ${tickTime}`);

            // rest of the code...
        }, this.msPerTick)
        */
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
        self.clearTimeout(this.intervalId);
    }
}

