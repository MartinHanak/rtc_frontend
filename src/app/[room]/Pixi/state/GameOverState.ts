import { HomeScreenState } from "./HomeScreenState";
import { State } from "./State";
import { Text } from "pixi.js";

export class GameOverState extends State {
    public handleRender() {
        // reset stage and ticker

        const heading = new Text("GameOver");
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
            this.context.transitionTo(new HomeScreenState())
            console.log('hello');
        });

        this.context.app.stage.addChild(heading);
        this.context.app.stage.addChild(next);
    }

    public handleCleanup(): void {
        //this.context.app.ticker.stop();
        this.context.app.stage.removeChildren();
    }
}