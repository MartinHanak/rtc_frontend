import { Point, Text } from "pixi.js";
import { State } from "./State";
import { LoadingState } from "./LoadingState";

export class HomeScreenState extends State {
    public handleRender() {
        // reset stage and ticker

        const heading = new Text("Home");
        heading.x = 0;
        heading.y = 0;

        const next = new Text("Next");
        next.anchor.set(1,0);
        next.x = this.context.app.screen.width;
        next.y = 0;
        

        // click
        next.eventMode = 'static';
        next.cursor = 'pointer';
        next.on('pointerdown', () => {
            this.context.transitionTo(new LoadingState())
            console.log('hello');
        });

        this.context.app.stage.addChild(heading);
        this.context.app.stage.addChild(next);
    }

    public handleCleanup(): void {
        this.context.app.stage.removeChildren()
    }
}