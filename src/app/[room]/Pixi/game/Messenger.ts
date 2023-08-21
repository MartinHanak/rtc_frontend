// abstract sending / receiving messages through WebRTC

import { ArrayBufferBuffer } from "./ArrayBufferBuffer";
import { Game } from "./Game";

export type dataChannelInput = {
    id: string,
    dataChannel: RTCDataChannel;
}

export class Messenger {
    
    private hostId: string;
    private localId: string;
    private dataChannels: Record<string, RTCDataChannel>

    private hostGameStateHandler: (event: CustomEvent<ArrayBuffer>) => void;
    private hostCommandHandler: (event: CustomEvent<ArrayBuffer>) => void;

    private dataChannelGameStateHandlers:  Record<string, (event: MessageEvent<ArrayBuffer>) => void>
    private dataChannelCommandHandlers: Record<string, (event: MessageEvent<ArrayBuffer>) => void>

    constructor(localId: string, hostId: string, dataChannels: dataChannelInput[]) {

        console.log(`Creating Messenger with ${dataChannels.length} connections`);
        this.localId = localId;
        this.hostId = hostId;

        this.dataChannels = {};
        dataChannels.forEach((input) => {
            this.dataChannels[input.id] = input.dataChannel;
        });

        this.dataChannelGameStateHandlers = {};
        this.dataChannelCommandHandlers = {};
    }

    get playerIds() {
        let playerIds = [this.hostId];
        for(const channelId in this.dataChannels) {
            playerIds.push(channelId)
        }
        return playerIds;
    }

    // commands go from client to server
    public sendCommand(command: ArrayBuffer) {

        // non-host players
        if(this.localId !== this.hostId) {
            for(const playerId in this.dataChannels) {
                this.dataChannels[playerId].send(command);
            }
        }

        // host player
        if(this.hostId && this.localId === this.hostId) {

            const commandEvent = new CustomEvent<ArrayBuffer>("hostCommand", {
                detail: command
            });

            window.dispatchEvent(commandEvent);
        }

    }

    // game state goes from server to clients
    public sendGameState(gameState: ArrayBuffer) {

        // host game
        const hostEvent = new CustomEvent("hostGameState", {
            detail: gameState
        });
        window.dispatchEvent(hostEvent);

        // non-host users
        for(const playerId in this.dataChannels) {
            this.dataChannels[playerId].send(gameState);
        }
    }

    // for now: only host listens for commands from all 
    public listenForCommands(webWorkerServer : Worker) {

        // non-local players
        for(const playerId in this.dataChannels) {
            this.dataChannels[playerId].addEventListener('message', (event : MessageEvent<ArrayBuffer>) => {

                webWorkerServer.postMessage(
                    {
                        playerId: playerId,
                        buffer: event.data
                    }, [event.data]
                );

            })
        }

        // host player
        window.addEventListener("hostCommand", (event: CustomEvent<ArrayBuffer>) => {

            webWorkerServer.postMessage(
                {
                    playerId: this.hostId,
                    buffer: event.detail
                }, [event.detail]
            );

        } );
  
    }

    private insertCommand(command: ArrayBuffer | null, buffer: ArrayBufferBuffer) {
        if(!command) {
            throw new Error(`Inserted command is not a valid ArrayBuffer: ${command}`)
        }

        // read command time
        let time = Math.floor(this.readArrayBufferTime(command));
        //console.log(`Received command for time ${time}`);

        buffer.insert(time, command);
    }

    // assume float 64, 1st number = time
    private readArrayBufferTime(buffer: ArrayBuffer) {
        let bufferView = new Float64Array(buffer);

        let time = bufferView[0];

        if(isNaN(time)) {
            throw new Error(`Could not read time from provided array buffer.`)
        }

        return time;
    }

    // each client runs their own version with their own buffer
    public listenForGameState(buffer: ArrayBufferBuffer, localGame: Game) {
        // host
        if(this.localId === this.hostId) {

            this.hostGameStateHandler = (event) => this.handleHostGameState(event, buffer, localGame);

            window.addEventListener("hostGameState",  this.hostGameStateHandler)

        } else {
            // non-host users
            // for now: only one data channel should be open for non-hosts
            for(const playerId in this.dataChannels) {
                this.dataChannelGameStateHandlers[playerId] = (event: MessageEvent<ArrayBuffer>) => this.handleDataChannelGameState(event, buffer, localGame);

                this.dataChannels[playerId].addEventListener('message', this.dataChannelGameStateHandlers[playerId])

            }
        }
    }

    private handleHostGameState(event: CustomEvent<ArrayBuffer>, buffer: ArrayBufferBuffer, localGame: Game) {

        let time = this.readArrayBufferTime(event.detail);
        if(time > localGame.time) {
            throw new Error('Server state in front of local game state')
        }

        buffer.insert(time,event.detail);
        localGame.serverDelay = localGame.time - time;
        // run server reconciliation
        localGame.serverReconciliation(time,event.detail);
    }

    private handleDataChannelGameState(event: MessageEvent<ArrayBuffer>, buffer: ArrayBufferBuffer, localGame: Game) {
        let time = this.readArrayBufferTime(event.data);
        if(time > localGame.time) {
            throw new Error('Server state in front of local game state')
        }

        buffer.insert(time,event.data);
        localGame.serverDelay = localGame.time - time;
        // run server reconciliation 
        localGame.serverReconciliation(time, event.data);
    }

}