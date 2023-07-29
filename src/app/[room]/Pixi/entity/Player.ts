import { Entity } from "./Entity";
import { Sprite } from "pixi.js";

export class Player extends Entity {

    constructor(id: string, name: string, sprite: Sprite) {
        super(id,name,sprite)
    }

    move() {
        // movement speed + pushBack speed
    }
}