// holds most information about the game
// methods for LOCAL game update
// Server is authoritative, Game has to make corrections if client and server disagree
export class Game {

    private players; 
    private npcs;

    private map; // background + boundaries + static assets

    private serverStateBuffer;
    private localStateBuffer;
    private localCommandsBuffer;

    constructor() {
        
    }
}