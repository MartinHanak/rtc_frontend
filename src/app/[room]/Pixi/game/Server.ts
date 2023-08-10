import { Player } from "../entity/Player";
import { Game } from "./Game";
import { Messenger } from "./Messenger";
import { ArrayBufferBuffer } from "./ArrayBufferBuffer";

// updates old game state given user inputs
export class Server {

    private tickRate: number = 10; // tickRate per second update

    get msPerTick() {
        return Math.floor(1000/this.tickRate);
    }
    // server does several game updates in one tick = to simulate approx. 60 FPS
    get stepsInOneTick() {
        return Math.max(1, Math.round(60 / this.tickRate));
    }

    private intervalId : number;

    private currentGame: Game;
    private playerIds: string[];
    private playerCommands: Record<string, ArrayBufferBuffer>;
    private messenger: Messenger;

    private currentTickCommands: Record< string, (ArrayBuffer|null)[] >

    constructor(game: Game, messenger: Messenger) {
        this.currentGame = game;
        this.messenger = messenger;

        this.playerIds = this.messenger.playerIds;
        this.playerCommands = {};
        for(const playerId of this.playerIds) {
           this.playerCommands[playerId] = new ArrayBufferBuffer();
        }

        this.currentTickCommands = {}
        for(const playerId of this.playerIds) {
            this.currentTickCommands[playerId] = [];
        }
    }

    public start() {
        console.log(`Server start`);
        // start listening for commands from players
        this.messenger.listenForCommands(this.playerCommands);


        // move interval to worker if not accurate enough
        let firstGameStateSent = false;
        let startGameProgress = false;
        let previousIntervalTime = Date.now();

        const initialServerDelay = this.msPerTick;

        this.intervalId = window.setInterval(() => {

            let newTime = Date.now();
            let tickTime = newTime - previousIntervalTime;
            let stepTime = tickTime / this.stepsInOneTick;
            previousIntervalTime = newTime;

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
                    this.messenger.sendGameState(this.currentGame.toArrayBuffer())
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

            if(startGameProgress && firstGameStateSent) {

                // read command buffers
                // split commands into steps for all players
                this.updateCurrentTickCommands(
                    this.currentGame.time,
                    this.currentGame.time + tickTime,
                    this.stepsInOneTick
                )
                // test
                console.log(`Server time: ${this.currentGame.time}`);
                for(const playerId in this.currentTickCommands) {
                    console.log(this.currentTickCommands[playerId])
                }

                for(let step = 0; step < this.stepsInOneTick; step++) {
                    // apply commands to current game (and current time window)
                    for(const playerId in this.currentTickCommands) {
                        // if no command = no update (uses previous player command instead)
                        let command = this.currentTickCommands[playerId][step];
                        if(command) {
                            console.log(`Command found for current step.`)
                            let player = this.currentGame.getEntity(playerId)
                            if(player instanceof Player) {
                                player.updateCurrentCommandFromArrayBuffer(command);
                                player.applyCurrentCommand();
                            } else {
                                console.log(`No player with id ${playerId} found.`);
                            }
                        } else {
                            console.log(`No command found for current step.`);
                        }
                    }
                    // progress game given the commands
                    this.currentGame.progressGameState(stepTime);
                    // LATER: save a new game state (with updated simulation time) 
                }
                // remove them from buffer
                this.forgetCommandsUntil(this.currentGame.time);
                // send new game state to all participants
                this.messenger.sendGameState(this.currentGame.toArrayBuffer());
            } else if( !startGameProgress && firstGameStateSent ) {
                // send game state without progressing the game
                // UDP connection: 1st game state might not have arrived
                this.messenger.sendGameState(this.currentGame.toArrayBuffer());
            }

        }, this.msPerTick)
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
        clearInterval(this.intervalId)
    }
}