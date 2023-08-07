// abstract sending / receiving messages through WebRTC

import { CommandBuffer } from "./CommandBuffer";
import { GameStateBuffer } from "./GameStateBuffer";

export type dataChannelInput = {
    id: string,
    dataChannel: RTCDataChannel;
}

export class Messenger {
    
    private hostId: string;
    private localId: string;
    private dataChannels: Record<string, RTCDataChannel>

    constructor(localId: string, hostId: string, dataChannels: dataChannelInput[]) {

        console.log(`Creating Messenger with ${dataChannels.length} connections`);
        this.localId = localId;
        this.hostId = hostId;

        this.dataChannels = {};
        dataChannels.forEach((input) => {
            this.dataChannels[input.id] = input.dataChannel;
        });
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
    public listenForCommands(playerBuffers: Record<string, CommandBuffer>) {
        // playerBuffers include hostId too
        for(const playerId in playerBuffers) {

            // listens for dataChannel message event for non-host users
            // listens for custom event hostCommand for host-user
            if (playerId !== this.hostId) {

                if(!(playerId in this.dataChannels)) {
                    throw new Error(`Messenger dit not find data channel corresponding to the player ${playerId}.`);
                }

                this.dataChannels[playerId].addEventListener('message', (event : MessageEvent<ArrayBuffer>) => {
                    this.insertCommand(event.data, playerBuffers[playerId]);
                })
            } else  {
                // host event
                window.addEventListener("hostCommand", (event: CustomEvent<ArrayBuffer>) => {
                   this.insertCommand(event.detail, playerBuffers[playerId]);
                })
            }

            
        }
    }

    private insertCommand(command: ArrayBuffer | null, buffer: CommandBuffer) {
        if(!command) {
            throw new Error(`Inserted command is not a valid ArrayBuffer: ${command}`)
        }

        // read command time
        let time = this.readArrayBufferTime(command);

        buffer.insertCommand(time, command);
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
    public listenForGameState(buffer: GameStateBuffer) {
        // host
        if(this.localId === this.hostId) {

            window.addEventListener("hostGameState", (event) => {
                let time = this.readArrayBufferTime(event.detail);
                buffer.insertGameState(time,event.detail);
            })

        } else {
            // non-host users
            // for now: only one data channel should be open for non-hosts
            for(const playerId in this.dataChannels) {

                this.dataChannels[playerId].addEventListener('message', (event: MessageEvent<ArrayBuffer>) => {
                    let time = this.readArrayBufferTime(event.data);
                    buffer.insertGameState(time,event.data);
                })

            }
        }
    }

}