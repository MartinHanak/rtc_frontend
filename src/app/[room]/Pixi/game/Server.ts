import { CommandBuffer } from "./CommandBuffer";
import { Game } from "./Game";
import { Messenger } from "./Messenger";

// updates old game state given user inputs
export class Server {

    private tickRate: number = 10; // tickRate per second update

    get msPerTick() {
        return Math.floor(1000/this.tickRate)
    }
    private intervalId : number;

    private currentGame: Game;
    private playerCommands: {[key: string] : CommandBuffer};
    private messenger: Messenger;

    constructor(game: Game, messenger: Messenger) {
        this.currentGame = game;
        this.messenger = messenger;

        // start listening for commands from players
    }

    public start() {
        // move interval to worker if not accurate enough
        this.intervalId = window.setInterval(() => {
            // apply commands to current game (and current time window)
            // remove them from buffer
            // progress game given the commands
            // save a new game state (with updated simulation time) 
            // send new game state to all participants
            //          this.messenger.sendGameState(gameState as ArrayBuffer)
        }, this.msPerTick)
    }

    public stop() {
        clearInterval(this.intervalId)
    }
}