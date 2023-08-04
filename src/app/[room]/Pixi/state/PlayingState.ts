import { text } from "stream/consumers";
import { GameOverState } from "./GameOverState";
import { State } from "./State";
import { Text, Sprite } from "pixi.js";
import { appendFile } from "fs";

export class PlayingState extends State {
    public handleRender() {
        // reset stage and ticker

        const heading = new Text("Playing");
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
            this.context.transitionTo(new GameOverState())
            console.log('hello');
        });

        this.context.app.stage.addChild(heading);
        this.context.app.stage.addChild(next);

        // game test

        const test = Sprite.from("https://pixijs.io/pixi-react/img/bunny.png");
        test.x = 0;
        test.y = 0;

        this.context.app.stage.addChild(test);
        
        this.context.app.ticker.add((delta) => {
            // display texture for current app state

            // update game state if playing
            test.y += Math.random()*10 - 5;
            test.x += Math.random()*10 - 5;

            // render new game state if playing
            
        })

        // test game
        const game = this.context.appWrapper.initializeGame();


        const frame = game.getCurrentFrame();
        this.context.app.stage.addChild(frame);

    }

    public handleCleanup(): void {
        this.context.app.stage.removeChildren()
    }
}