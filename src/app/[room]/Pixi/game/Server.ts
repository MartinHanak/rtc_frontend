import { Messenger } from "./Messenger";
import { ServerInitializationData } from "./WebWorkerServer";

// updates old game state given user inputs
export class Server {

    private messenger: Messenger;
    private webWorkerServer: Worker;

    constructor(initData: ServerInitializationData, messenger: Messenger) {

        this.messenger = messenger;

        this.webWorkerServer = new Worker(new URL('./WebWorkerServer.ts', import.meta.url));
        this.webWorkerServer.postMessage(initData);

        this.webWorkerServer.addEventListener('message', (e) => console.log(e.data));
        this.webWorkerServer.addEventListener('error', (err) => {console.log(err.message)});
        this.webWorkerServer.addEventListener('messageerror', (err) => {console.log(err)});

    }

    public start() {
        console.log(`Server start`);


        // start listening for commands from players
        // send them to the web worker
        this.messenger.listenForCommands(this.webWorkerServer)

        // react to web worker message
        // use messenger to send game state to other players
        this.webWorkerServer.addEventListener('message', (event) => {

            if(event.data.type === 'gameState') {
                this.messenger.sendGameState(event.data.buffer)
            }

        });
        
    }

    public stop() {
        this.webWorkerServer.terminate();
    }
}