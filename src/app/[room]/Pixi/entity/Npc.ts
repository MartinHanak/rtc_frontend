import { Entity } from "./Entity";
import { Sprite } from "pixi.js";
import { StatusEffectType } from "./StatusEffect";

export class Npc extends Entity {
    constructor(id: string, name: string, sprite: Sprite) {
        super(id,name,sprite)
    }

    public move(deltaTime: number) {
        // movement
        this.position = [
            this.position.x + deltaTime * this.velocity.x,
            this.position.y + deltaTime * this.velocity.y
        ]


        // pushback
        const pushback = this.getStatusEffect(StatusEffectType.PUSHBACK)
        if(pushback.duration > 0) {
            this.position = [
                this.position.x + deltaTime * pushback.direction.x * this._pushBackSpeed,
                this.position.y + deltaTime * pushback.direction.y * this._pushBackSpeed
            ]
        }
    }
}