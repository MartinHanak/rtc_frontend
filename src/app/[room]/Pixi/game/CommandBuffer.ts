// buffer for user commands
// slightly different for server / client
// server has one-buffer for each user
export class CommandBuffer {

    // whether it is client / server
    private server: boolean;

    constructor(server : boolean) {
        this.server = server;
    }
}