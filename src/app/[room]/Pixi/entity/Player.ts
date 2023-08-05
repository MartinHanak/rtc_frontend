import { Command } from "../game/Command";
import { Entity } from "./Entity";
import { Sprite } from "pixi.js";

export class Player extends Entity {
    // player input for the current frame
    private currentPlayerCommand: Command;

    constructor(id: string, name: string, sprite: Sprite) {
        super(id,name,sprite);
        this.currentPlayerCommand = new Command(0,0,0,0,0,false,false);
    }

    // method used mainly by the server
    public updateCurrentCommandFromArrayBuffer(commandBuffer: ArrayBuffer) {
        // read data from array buffer
        // update currentPlayerCommand
    }

    // method used mainly on the client side
    public updateCurrentCommand(time: number, dir_x: number, dir_y: number, vel_x: number, vel_y: number, attack: boolean, block: boolean) {

        this.currentPlayerCommand.updateCurrentCommand(
            time,
            dir_x, dir_y,
            vel_x, vel_y,
            attack, block
        );

    }

    // read values from command to update Player state
    public applyCurrentCommand() {
        // TEMPORARY: only velocity changes
        this.velocity = [this.currentPlayerCommand.velocity.x,this.currentPlayerCommand.velocity.y]
    }

    move(deltaTime: number) {
        // movement speed + pushBack speed
        // TEMPORARY: only movement
        this.position = [
            this.position.x + deltaTime * this.velocity.x ,
            this.position.y + deltaTime * this.velocity.y
        ]
    }
}