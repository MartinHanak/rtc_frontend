import { dir } from "console";
import { Command } from "../game/Command";
import { movementKeys, statusKeys } from "../game/InputListener";
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
    public updateCurrentCommand(time: number, movement: movementKeys, status: statusKeys) {
        let dir_x = 0;
        let dir_y = 0;
        let vel_x = 0;
        let vel_y = 0;

        //x-axis
        if(movement.left && !movement.right) {
            dir_x = -1;
            vel_x = -1;
        } else if (!movement.left && movement.right) {
            dir_x = 1;
            vel_x = 1;
        }

        // y-axis
        if(movement.up && !movement.down) {
            dir_y = -1;
            vel_y = -1;
        } else if (!movement.up && movement.down) {
            dir_y = 1;
            vel_y = 1;
        }

        // normalize velocity by player speed 
        // FOR NOW: assumes only diagonal movement
        // LATER: add all possible directions
        if(Math.abs(vel_x) > 0 && Math.abs(vel_y) > 0) {
            vel_x = vel_x * this.speed * 0.7071;
            vel_y = vel_y * this.speed * 0.7071;
        } else if(Math.abs(vel_x) > 0 ) {
            vel_x = vel_x * this.speed;
        } else if (Math.abs(vel_y) > 0) {
            vel_y = vel_y * this.speed;
        }
    

        this.currentPlayerCommand.updateCurrentCommand(
            time,
            dir_x, dir_y,
            vel_x, vel_y,
            status.attack, 
            status.block
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