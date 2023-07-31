import { Point } from "pixi.js";
import { pointInput } from "../object/Map";

export enum StatusEffectType {
    PUSHBACK = 'PUSHBACK' ,
    ATTACK = 'ATTACK' ,
    BLOCK = 'BLOCK'
}

// Helper function to convert string enum values to indexes
export function getStringEnumIndex<T extends string, U extends { [key: string]: T }>(enumObj: U, value: T): number {
  const index = Object.values(enumObj).indexOf(value);
  if (index === -1) {
    throw new Error(`Value '${value}' is not a valid string enum member.`);
  }
  return index;
}

// Helper function to convert indexes back to corresponding string enum values
export function getStringEnumValue<T extends string, U extends { [key: string]: T }>(enumObj: U, index: number): T {
  const values = Object.values(enumObj);
  if (index < 0 || index >= values.length) {
    throw new Error(`Index ${index} is out of range.`);
  }
  return values[index];
}

// numerical enum is bidirectional
// have to divide by 2
// string enum do not need to divide by 2
export const STATUS_EFFECT_NUMBER = Object.keys(StatusEffectType).length ;
// number of fields/values for one status effect
export const STATUS_EFFECT_LENGTH = 5;

export class StatusEffect {

    private _startTime: number; // simulation start time
    private _duration: number; // in ms, simulation time
    private _type: StatusEffectType;
    private _direction: Point;

    constructor(start: number, duration: number, type: StatusEffectType, direction_x: number, direction_y: number) {
        this._startTime = start;
        this._duration = duration;
        this._type = type;
        this._direction = new Point(direction_x, direction_y);
    }


    get startTime() {
        return this._startTime;
    }

    set startTime(simulationTime: number) {
        this._startTime = simulationTime;
    }

    get duration() {
        return this._duration;
    }

    set duration(durationInMS: number) {
        this._duration = durationInMS;
    }

    get type() {
        return this._type;
    }

    set type(type: StatusEffectType) {
        this._type = type;
    }

    get direction() : Point {
        return this._direction;
    }

    set direction([x,y] : pointInput) {
        this._direction.set(x,y);
    }

} 