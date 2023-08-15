import { text } from "stream/consumers";
import { GameOverState } from "./GameOverState";
import { State } from "./State";
import { Text, Sprite } from "pixi.js";
import { appendFile } from "fs";
import { Player } from "../entity/Player";
import { Server } from "../game/Server";
import { Command } from "../game/Command";

export class PlayingState extends State {

    private server: Server;

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
        
        this.context.app.ticker.add(() => {
            // display texture for current app state

            // update game state if playing
            test.y += Math.random()*10 - 5;
            test.x += Math.random()*10 - 5;

            // render new game state if playing
            
        })

        // configure messenger - reads data from react context Ref
        this.context.appWrapper.startMessenger()

        // game
        const game = this.context.appWrapper.initializeGame();

        // server
        if(this.context.appWrapper.localId === this.context.appWrapper.hostId) {
            // server initializes its own instance of the same game
            this.server = new Server(
                this.context.appWrapper.initializeGame(),
                this.context.appWrapper.messenger
            );

            this.context.appWrapper.server = this.server;

           this.server.start();
        }

        // client-side: start listening for game states from the server
        this.context.appWrapper.messenger.listenForGameState(game.serverStateBuffer, game);

        const frame = game.getCurrentFrame();
        this.context.app.stage.addChild(frame);

        const localPlayerId = this.context.appWrapper.localId;
        const localPlayer = game.getEntity(localPlayerId) as Player;

        // sync server-client: 
        // server ready when 1st game state received from the server
        // send empty commands until then
        let firstGameStateReceived = false;
        const emptyCommand = new Command(0,0,0,0,0,false,false).toArrayBuffer();

        let previousRenderTime = Date.now();

        this.context.app.ticker.add(() => {
            // time from last frame to this frame in ms
            let newTime = Date.now();
            let delta = newTime - previousRenderTime;
            previousRenderTime = newTime;
            
            // sync game start with the server
            // wait for 1st game state before progressing the game
            // send empty commands until then
            if(!firstGameStateReceived) {
                if(game.serverStateBuffer.bufferLength > 0) {
                    console.log(`Server is ready. First game state was received`);
                    firstGameStateReceived = true;
                } else {
                    this.context.appWrapper.messenger.sendCommand(emptyCommand);
                    return;
                }
            }
            

            // read user input (multiple inputs combined into one command)
            // update game current command
            this.context.appWrapper.localInput.updatePlayerCommandFromLocalInput(localPlayer, game.time);

            const commandForCurrentFrame = localPlayer.command;
            // send current command to the server

            this.context.appWrapper.messenger.sendCommand(
                commandForCurrentFrame
            )

            // save command to local command buffer
            game.localCommandsBuffer.insert(game.time, commandForCurrentFrame);
            // save game state to local buffer
            game.localStateBuffer.insert(game.time, game.toArrayBuffer());

            // apply command to update player state
            localPlayer.applyCurrentCommand();

            // non-local players: interpolation
            game.interpolateNonLocalEntities(game.serverDelay, localPlayerId);

            // update game state (client-side prediction)
            // later: add server-check (server reconsiliation)
            game.progressGameState(delta);

            // discard old game states and local command buffer values
        })

    }

    public handleCleanup(): void {
        this.context.app.stage.removeChildren();

        if(this.server) {
            this.server.stop();
        }
    }
}