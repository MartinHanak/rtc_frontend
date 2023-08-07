// class representing one player-command
// send to the server

import { Point } from "pixi.js"
import { STATUS_EFFECT_NUMBER, StatusEffectType } from "../entity/StatusEffect";

// client keeps local copy
export class Command {

    // exact client-side simulation time
    private simulationTime: number
    // direction when command created
    private playerDirection: Point;
    // velocity = combination of all user inputs (pushback not included)
    private intendedVelocity: Point;

    get velocity() {
        return this.intendedVelocity;
    }

    // whether or not buttons were pressed for different status effects 
    // only attack/block (pushback is result of other players actions)
    private statusActions: {[type in StatusEffectType] : boolean } 

    constructor(time: number, dir_x: number, dir_y: number, vel_x: number, vel_y: number, attack: boolean, block: boolean) {
        this.simulationTime = time;

        this.playerDirection = new Point(dir_x, dir_y);

        this.intendedVelocity = new Point(vel_x, vel_y);

        this.statusActions = {} as {[type in StatusEffectType] : boolean } ;
        this.statusActions.ATTACK = attack;
        this.statusActions.BLOCK = block;
    }

    public updateCurrentCommand(time: number, dir_x: number, dir_y: number, vel_x: number, vel_y: number, attack: boolean, block: boolean) {
        this.simulationTime = time;
        this.playerDirection.set(dir_x, dir_y);
        this.intendedVelocity.set(vel_x, vel_y);
        this.statusActions.ATTACK = attack;
        this.statusActions.BLOCK = block;
    }

    get arrayBufferLength() {
        // time, direction, velocity = 5 numbers of 8 bytes
        // each status effect = 1 number
        // DOES not include pushback
        return 40 + (STATUS_EFFECT_NUMBER - 1) * 8;
    }

    public toArrayBuffer() {
        const buffer = new ArrayBuffer(this.arrayBufferLength);
        const bufferView = new Float64Array(buffer);

        bufferView[0] = this.simulationTime;

        bufferView[1] = this.playerDirection.x;
        bufferView[2] = this.playerDirection.y;

        bufferView[3] = this.intendedVelocity.x;
        bufferView[4] = this.intendedVelocity.y;

        // boolean represented as number = 0 or 1
        bufferView[5] = this.statusActions.ATTACK ? 1 : 0; 
        bufferView[6] = this.statusActions.BLOCK ? 1 : 0;

        return buffer;
    }

    public updateFromArrayBuffer(buffer: ArrayBuffer) {
        if(buffer.byteLength !== this.arrayBufferLength) {
            throw new Error(`Command incoming array buffer has different size ${buffer.byteLength} than expected ${this.arrayBufferLength}`);
        }

        const bufferView = new Float64Array(buffer);

        this.simulationTime = bufferView[0];
        this.playerDirection.set(bufferView[1], bufferView[2]);

        this.intendedVelocity.set(bufferView[3], bufferView[4]);

        this.statusActions.ATTACK = bufferView[5] > 0 ? true : false;
        this.statusActions.BLOCK = bufferView[6] > 0 ? true : false;
    }
}