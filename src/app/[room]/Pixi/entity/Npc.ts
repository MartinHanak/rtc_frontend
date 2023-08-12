import { Entity } from "./Entity";
import { Sprite } from "pixi.js";

export class Npc extends Entity {
    constructor(id: string, name: string, sprite: Sprite) {
        super(id,name,sprite)
    }

    public move(deltaTime: number) {
        // movement speed + pushBack speed
    }
}