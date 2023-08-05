import { Command } from "../game/Command";
import { Entity } from "./Entity";
import { Sprite } from "pixi.js";

export class Player extends Entity {
    // player input for the current frame
    public currentPlayerCommand: Command;

    constructor(id: string, name: string, sprite: Sprite) {
        super(id,name,sprite);
        this.currentPlayerCommand = new Command(0,0,0,0,0,false,false);
    }

    move() {
        // movement speed + pushBack speed
    }
}