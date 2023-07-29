import { Point, Sprite } from "pixi.js";
import { StatusEffect, StatusEffectType } from "./StatusEffect";

export abstract class Entity {

    // visual representation;
    private id: string
    private name: string;
    private sprite: Sprite;

    private _position: Point = new Point(0, 0);
    private _speed: number = 20;
    private _pushBackSpeed: number = 40;
    private _velocity: Point = new Point(0, 0); // does not include push-back from others


    private _attackDuration: number = 500;
    private _blockDuration: number = 1000;

    private _attackCoolDownTime: number = 1000; // ms
    private _blockCoolDownTime: number = 2000;
    private _statusEffects: {[type in StatusEffectType] : StatusEffect | null} 
    

    constructor(id: string, name: string, sprite: Sprite) {
        this.id = id;
        this.name = name;
        this.sprite = sprite;
    }


    get position(): Point {
        return this.position
    } 

    set position({x, y}: {x: number, y: number}) {
        this.position.set(x, y);
    }

    // update position
    public abstract move(): void;

    public attack(startTime: number, x: number, y: number) {

        this._statusEffects.attack = new StatusEffect(
            startTime,
            this._attackDuration,
            StatusEffectType.attack, 
            x, y
        );

    }

    public block(startTime: number, x: number, y: number) {

        this._statusEffects.block = new StatusEffect(
            startTime,
            this._attackDuration,
            StatusEffectType.block, 
            x, y
        );
    }

    public applyPushBack(startTime: number, x: number, y: number, duration: number) {

        this._statusEffects.pushBack = new StatusEffect(
            startTime, 
            duration,
            StatusEffectType.pushBack,
            x, y
        );
    }

    public resetStatusEffect(type: StatusEffectType) {
        this._statusEffects[type] = null;
    }


    // return what to render
    // includes movement direction and status effects 
    public getCurrentSprite(simulationTime: number) {
        
    }
}