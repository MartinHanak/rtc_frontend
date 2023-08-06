"use client"
import { Application, Point, Sprite, Texture } from "pixi.js";
import { Context } from "./state/Context";
import { HomeScreenState } from "./state/HomeScreenState";
import { Player } from "./entity/Player";
import { Npc } from "./entity/Npc";
import { Map, pointInput } from "./object/Map";
import { Game } from "./game/Game";
import { InputListener } from "./game/InputListener";

type playerInput = {
    id: string,
    name: string,
    dataChannel: RTCDataChannel
}


export class PixiApp {

    private application: Application | null;
    private parentContainer: HTMLDivElement;
    private stateContext: Context;

    public localId: string;
    public hostId: string;

    public localInput: InputListener;
    public playerInput: playerInput[];

    constructor(parentContainer: HTMLDivElement, players: playerInput[], localId: string, hostId: string) {
        console.log(`Initializing PixiApp`);

        this.parentContainer = parentContainer;

        // start listening for user inputs
        this.localInput = new InputListener();
        this.localInput.start();

        this.playerInput = players;
        this.localId = localId;
        this.hostId = hostId;

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

    // used for local AND server game initialization
    public initializeGame() {
        // if host: start server game + start server
        const testTexture = Texture.from("https://pixijs.io/pixi-react/img/bunny.png");
        const testId = 'testId';
        const testName = 'MyName';

        const testPlayer = new Player(testId, testName, new Sprite(testTexture));

        const testNpc1 = new Npc('npc1','npc1',new Sprite(testTexture));
        const testNpc2 = new Npc('npc2','npc2',new Sprite(testTexture));

        const mapBoundaryPoints : pointInput[] = [[100,100],[100,900],[900,900],[900,100]];
        const testMap = new Map(mapBoundaryPoints, new Sprite(testTexture));

        const testGame = new Game(testMap,[testPlayer],[testNpc1, testNpc2]);
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
    }
}