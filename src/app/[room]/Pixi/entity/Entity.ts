import { Container, Point, Sprite } from "pixi.js";
import { STATUS_EFFECT_LENGTH, STATUS_EFFECT_NUMBER, StatusEffect, StatusEffectType, getStringEnumIndex, getStringEnumValue } from "./StatusEffect";
import { pointInput } from "../object/Map";

export abstract class Entity {

    // visual representation;
    private id: string;
    private name: string;
    private sprite: Sprite;
    private currentSpriteContainer: Container;

    private _position: Point = new Point(0, 0);
    private _speed: number = 20;
    private _pushBackSpeed: number = 40;
    private _velocity: Point = new Point(0, 0); // does not include push-back from others


    private _attackDuration: number = 500;
    private _blockDuration: number = 1000;

    private _attackCoolDownTime: number = 1000; // ms
    private _blockCoolDownTime: number = 2000;
    private _statusEffects: {[type in StatusEffectType] : StatusEffect } 
    

    constructor(id: string, name: string, sprite: Sprite) {
        this.id = id;
        this.name = name;

        this.sprite = sprite;
        this.currentSpriteContainer = new Container();
        this.currentSpriteContainer.addChild(this.sprite);

        // 0 duration status effect is considered empty
        Object.values(StatusEffectType).forEach((value, index) => {
            this._statusEffects[value] = new StatusEffect(0,0,value,0,0);
        })
    }


    get position(): Point {
        return this._position;
    } 

    set position([x,y] : pointInput) {
        this._position.set(x, y);
    }

    get velocity() : Point {
        return this._velocity
    }

    set velocity([x,y] : pointInput) {
        this._velocity.set(x, y);
    }

    // update position
    public abstract move(): void;

    public attack(startTime: number, x: number, y: number) {

        this._statusEffects.ATTACK = new StatusEffect(
            startTime,
            this._attackDuration,
            StatusEffectType.ATTACK, 
            x, y
        );

    }

    public block(startTime: number, x: number, y: number) {

        this._statusEffects.BLOCK = new StatusEffect(
            startTime,
            this._attackDuration,
            StatusEffectType.BLOCK, 
            x, y
        );
    }

    public applyPushBack(startTime: number, x: number, y: number, duration: number) {

        this._statusEffects.PUSHBACK = new StatusEffect(
            startTime, 
            duration,
            StatusEffectType.PUSHBACK,
            x, y
        );
    }

    public resetStatusEffect(type: StatusEffectType) {
        // 0 duration is considered empty
        this._statusEffects[type] = new StatusEffect(0,0,type,0,0);
    }


    // return what to render
    // includes movement direction and status effects 
    public getCurrentSprite(simulationTime: number) {
        
    }

    get arrayBufferByteLength() {
        // position = 16, velocity = 16, 1 status effect = 40
        return 32 + 40 * STATUS_EFFECT_NUMBER;
    }

    // for network data transmit
    // convert to/from array buffer
    // used in one big blob send through the network
    public toBufferView() {
        // only changing data transmitted = position + velocity + statusEffects

        // array buffer structure:
        // 8 bytes = one number in javascript
        // position = 16 bytes
        // velocity = 16 bytes
        // 1 status effect = 5 * 8 bytes (start, duration, type, dir_x, dir_y)
        // status effect type represented as number
        const arrayBufferByteLength = this.arrayBufferByteLength;
        const statusEffectLength = STATUS_EFFECT_LENGTH;

        const buffer = new ArrayBuffer(arrayBufferByteLength);
        const bufferView = new Float64Array(buffer);

        bufferView[0] = this._position.x;
        bufferView[1] = this._position.y;

        bufferView[2] = this._velocity.x;
        bufferView[3] = this._velocity.y;

        // order = pushBack / attack / block
        Object.values( StatusEffectType ).forEach((value: StatusEffectType, index: number) => {

            if( this._statusEffects[value] && this._statusEffects[value].duration > 0 ) {
                bufferView[4 + index * statusEffectLength] = this._statusEffects[value].startTime;
                bufferView[5 + index * statusEffectLength] = this._statusEffects[value].duration;
                // type converted to index
                bufferView[6 + index * statusEffectLength] = getStringEnumIndex(StatusEffectType, value);
                bufferView[7 + index * statusEffectLength] = this._statusEffects[value].direction.x;
                bufferView[8 + index * statusEffectLength] = this._statusEffects[value].direction.y;

            } else {
                // status effect is 0 duration = empty
                // leave default 0 values everywhere
                return;
            }
            
        })

        return bufferView;

    }

    // update Entity from arraybuffer
    public updateFromArrayBuffer(buffer: ArrayBuffer) {
        // array buffer has same structure as toBufferView
        if(buffer.byteLength !== this.arrayBufferByteLength) {
            throw new Error(`Update array buffer has different length ${buffer.byteLength} than expected ${this.arrayBufferByteLength}`)
        }

        const bufferView = new Float64Array(buffer);

        this.position = [ bufferView[0], bufferView[1] ];
        this.velocity = [ bufferView[2], bufferView[3] ];

        Object.values( StatusEffectType ).forEach((value: StatusEffectType, index: number) => {
            // check if status effect has non-zero duration
            if(bufferView[5 + index * STATUS_EFFECT_LENGTH] && bufferView[5 + index * STATUS_EFFECT_LENGTH] > 0) {

                this._statusEffects[value].startTime = bufferView[4 + index * STATUS_EFFECT_LENGTH];
                this._statusEffects[value].duration  = bufferView[5 + index * STATUS_EFFECT_LENGTH];
                // index converted to value
                this._statusEffects[value].type 
                = getStringEnumValue(StatusEffectType, bufferView[6 + index * STATUS_EFFECT_LENGTH] );

                this._statusEffects[value].direction = [
                    bufferView[7 + index * STATUS_EFFECT_LENGTH],
                    bufferView[8 + index * STATUS_EFFECT_LENGTH]
                ];

            } else {
                // status effect is empty otherwise = 0 duration
                this._statusEffects[value].duration = 0;
                this._statusEffects[value].startTime = 0;
            }
        })


    }
}