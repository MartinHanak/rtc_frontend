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

    constructor(game: Game, messenger: Messenger) {
        this.currentGame = game;
        this.messenger = messenger;

        this.playerIds = this.messenger.playerIds;
        this.playerCommands = {};
        for(const playerId of this.playerIds) {
           this.playerCommands[playerId] = new CommandBuffer();
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
                    if(this.playerCommands[playerId].lastInsertedTime < this.msPerTick) {
                        startGameProgress = false;
                        break;
                    }
                }
            }
            
            
            if(startGameProgress) {
                
                console.log(`All players sent enough commands for one server tick`);

                for(let step = 0; step < this.stepsInOneTick; step++) {
                    // apply commands to current game (and current time window)
                    // remove them from buffer
                    // progress game given the commands
                    // save a new game state (with updated simulation time) 
                }
                // send new game state to all participants
                //          this.messenger.sendGameState(gameState as ArrayBuffer)
            }
        }, this.msPerTick)
    }

    public stop() {
        clearInterval(this.intervalId)
    }
}