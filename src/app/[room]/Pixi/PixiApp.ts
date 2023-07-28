"use client"
import { Application, Point, Sprite } from "pixi.js";
import { Context } from "./state/Context";
import { HomeScreenState } from "./state/HomeScreenState";

export class PixiApp {

    private application: Application | null;
    private parentContainer: HTMLDivElement;
    private stateContext: Context

    constructor(parentContainer: HTMLDivElement) {
        console.log(`Initializing PixiApp`);

        this.parentContainer = parentContainer;

        this.application = new Application<HTMLCanvasElement>({
            backgroundColor: 0x3495ed,
            width: this.getSizeFromParent().width,
            height: this.getSizeFromParent().height
        });

        this.stateContext = new Context(this.application, new HomeScreenState());

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

 

    public cleanup() {
        console.log(`Cleaning up PixiApp.`)
        if(this.application) {
            this.application.stop();
            this.application.destroy(true);
            this.application = null;
        }
    }
}