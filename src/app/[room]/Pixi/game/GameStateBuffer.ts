// store game states in a hash map
// key = time
// value = ArrayBuffer representing the game state
export class GameStateBuffer {


    // key-value of game states
    private gameStates : Map<number,ArrayBuffer>;
    // latest update
    private lastSimulationTime : number; // in ms
    // maximum number of game states stored in memory
    private maximumSize: number = 10;

    constructor(initialGameState: ArrayBuffer) {

        this.gameStates.set(0, initialGameState);
        this.lastSimulationTime = 0;

    }

    public insertGameState(simulationTime: number, gameState: ArrayBuffer) {

        this.gameStates.set(simulationTime, gameState);

        // states can arrive out-of-order when using UDP
        if(simulationTime > this.lastSimulationTime) {
            this.lastSimulationTime = simulationTime
        }


        // Map remembers insertion order
        // removes  stored states
        while(this.gameStates.size > this.maximumSize) {

            const timeIterator = this.gameStates.keys();
            let timeToBeRemoved = timeIterator.next().value;

            // never remove last simulation time
            if(timeToBeRemoved === this.lastSimulationTime) {
                timeToBeRemoved = timeIterator.next().value;
            }

            const success = this.gameStates.delete(timeToBeRemoved)

            if(!success) {
                throw new Error(`Game buffer tried to remove non-existing state`);
            }
        }
    }

    public getLastGameState() {
        const lastState = this.gameStates.get(this.lastSimulationTime)

        if(!lastState) {
            throw new Error(`There is no game state stored for lastSimulationTime.`)
        }

        return lastState
    }
}