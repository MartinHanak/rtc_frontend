import { Player } from "../entity/Player";
import { CommandBuffer } from "./CommandBuffer";
import { Game } from "./Game";
import { Messenger } from "./Messenger";

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
    get msPerStep() {
        return Math.floor(this.msPerTick / this.stepsInOneTick);
    }
    private intervalId : number;

    private currentGame: Game;
    private playerIds: string[];
    private playerCommands: Record<string, CommandBuffer>;
    private messenger: Messenger;

    private currentTickCommands: Record< string, (ArrayBuffer|null)[] >

    constructor(game: Game, messenger: Messenger) {
        this.currentGame = game;
        this.messenger = messenger;

        this.playerIds = this.messenger.playerIds;
        this.playerCommands = {};
        for(const playerId of this.playerIds) {
           this.playerCommands[playerId] = new CommandBuffer();
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
        let startGameProgress = false;
        this.intervalId = window.setInterval(() => {
            // once all players send enough commands for one server tick:
            // start the first tick and loop
            if(!startGameProgress) {
                startGameProgress = true
                for(const playerId in this.playerCommands) {
                    if(this.playerCommands[playerId].bufferLength < 10) {
                        startGameProgress = false;
                        break;
                    }
                }
            }
            
            
            if(startGameProgress) {

                // read command buffers
                // split commands into steps for all players
                this.updateCurrentTickCommands(
                    this.currentGame.time,
                    this.currentGame.time + this.msPerTick,
                    this.stepsInOneTick
                )

                for(let step = 0; step < this.stepsInOneTick; step++) {
                    // apply commands to current game (and current time window)
                    for(const playerId in this.currentTickCommands) {
                        // if no command = no update (uses previous player command instead)
                        let command = this.currentTickCommands[playerId][step];
                        if(command) {
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
                    this.currentGame.progressGameState(this.msPerStep);
                    // LATER: save a new game state (with updated simulation time) 
                }
                // remove them from buffer
                this.forgetCommandsUntil(this.currentGame.time);
                // send new game state to all participants
                this.messenger.sendGameState(this.currentGame.toArrayBuffer());
            }
        }, this.msPerTick)
    }

    private forgetCommandsUntil(time: number) {
        for(const playerId in this.playerCommands) {
            this.playerCommands[playerId].removeCommandsUpto(time);
        }
    }

    private updateCurrentTickCommands(startTime: number, endTime: number, steps: number) {
        for(const playerId in this.currentTickCommands) {
            this.currentTickCommands[playerId] = this.playerCommands[playerId].getCommandsWithinWindow(startTime,endTime,steps)
        }
    }

    public stop() {
        clearInterval(this.intervalId)
    }
}