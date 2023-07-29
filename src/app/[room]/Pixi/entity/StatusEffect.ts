import { Point } from "pixi.js";

export enum StatusEffectType {
    pushBack = 'pushBack',
    attack = 'attack',
    block = 'block'
}


export class StatusEffect {

    private startTime: number; // simulation start time
    private duration: number; // in ms, simulation time
    private type: StatusEffectType;
    private direction: Point;

    constructor(start: number, duration: number, type: StatusEffectType, direction_x: number, direction_y: number) {
        this.startTime = start;
        this.duration = duration;
        this.type = type;
        this.direction = new Point(direction_x, direction_y);
    }
} 