"use client"
import { Application, Point, Sprite, Texture } from "pixi.js";
import { Context } from "./state/Context";
import { HomeScreenState } from "./state/HomeScreenState";
import { Player } from "./entity/Player";
import { Npc } from "./entity/Npc";
import { Map, pointInput } from "./object/Map";
import { Game } from "./game/Game";
import { InputListener } from "./game/InputListener";
import { Messenger } from "./game/Messenger";
import { dataChannelWithSocketId } from "../components/WebRTCContext";
import { Server } from "./game/Server";

type nameInput = {
    id: string,
    name: string
}


export class PixiApp {

    private application: Application | null;
    private parentContainer: HTMLDivElement;
    private stateContext: Context;

    public localId: string;
    public hostId: string;

    public localInput: InputListener;
    public dataChannels: dataChannelWithSocketId[];
    public messenger: Messenger;
    // match player Id to player name
    private playerNamesInput: nameInput[];
    public playerNames: Record<string, string>; 

    public server: Server;

    constructor(parentContainer: HTMLDivElement, localId: string, hostId: string, dataChannels: dataChannelWithSocketId[],nameInput?:nameInput[]) {
        console.log(`Initializing PixiApp`);

        this.parentContainer = parentContainer;

        // start listening for user inputs
        this.localInput = new InputListener();
        this.localInput.start();
        
        this.dataChannels = dataChannels;
        this.localId = localId;
        this.hostId = hostId;

        // player names match their id
        this.playerNames = {}
        if(nameInput) {
            for(const input of nameInput) {
                this.playerNames[input.id] = input.name;
            }
        }



        this.application = new Application<HTMLCanvasElement>({
            backgroundColor: 0x3495ed,
            width: this.getSizeFromParent().width,
            height: this.getSizeFromParent().height
        });

        this.stateContext = new Context(this, this.application, new HomeScreenState());

        // load textures

        // render current state
        // this.stateContext.render();
    
        // append to DOM
        this.parentContainer.appendChild(this.application.view as HTMLCanvasElement);
    }

    get width() {
        return this.application?.screen.width || 0
    }

    get height() {
        return this.application?.screen.height || 0
    }

    // real position = given by size of the world (background) in pixels
    // displayed position = depends on the player position and canvas size
    public getDisplayedPosition(position: Point, displayCenter: Point): Point {
        return new Point( position.x - displayCenter.x + this.width / 2, position.y - displayCenter.y + this.height / 2);
    }


    private getSizeFromParent() {
        let width = this.parentContainer.clientWidth;
        let height = this.parentContainer.clientHeight;

        const minimumWidth = 250;
        const minimumHeight = 250;

        if(isNaN(width) || isNaN(height) ) {
            width = minimumWidth;
            height = minimumHeight;
        } else if(width < minimumWidth) {
            width = minimumWidth
        } else if(height < minimumHeight) {
            height = minimumHeight
        }
        return { width, height }
    }

    public startMessenger() {
        // create messenger for sending data to/listening for data from the server
        
        this.messenger = new Messenger(this.localId, this.hostId, this.dataChannels.map((channel) => {
            return {id: channel.fromSocketId, dataChannel: channel.dataChannel}
        }));
    }

    // used for local AND server game initialization
    public initializeGame() {

        // if host: start server game + start server
        const testTexture = Texture.from("https://pixijs.io/pixi-react/img/bunny.png");

        const players = [];
        console.log('Initilizing the game')
        for(const channel of this.dataChannels) {
            let id = channel.fromSocketId;
            let name = channel.fromSocketId;
            console.log(id)

            if (id in this.playerNames) {
                name = this.playerNames[id]
            }

            const player = new Player(id, name, new Sprite(testTexture));

            players.push(player)

        }
        const localPlayer = new Player(this.localId, this.localId, new Sprite(testTexture))
        players.push(localPlayer);

        const testNpc1 = new Npc('npc1','npc1',new Sprite(testTexture));
        const testNpc2 = new Npc('npc2','npc2',new Sprite(testTexture));

        const mapBoundaryPoints : pointInput[] = [[100,100],[100,900],[900,900],[900,100]];
        const testMap = new Map(mapBoundaryPoints, new Sprite(testTexture));

        const testGame = new Game(testMap,players,[testNpc1, testNpc2]);
        console.log(`New game created`)
        console.log(testGame);
        return testGame;
    }

    

 

    public cleanup() {
        console.log(`Cleaning up PixiApp.`)
        this.localInput.stop();
        if(this.application) {
            this.application.stop();
            this.application.destroy(true);
            this.application = null;
        }

        if(this.server) {
            this.server.stop();
        }
    }
}