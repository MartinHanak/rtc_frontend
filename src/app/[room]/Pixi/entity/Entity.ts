import { Container, Point, Sprite } from "pixi.js";
import { STATUS_EFFECT_LENGTH, STATUS_EFFECT_NUMBER, StatusEffect, StatusEffectType, getStringEnumIndex, getStringEnumValue } from "./StatusEffect";
import { pointInput } from "../object/Map";
import { ArrayBufferBuffer, bufferWithTime } from "../game/ArrayBufferBuffer";

export type EntityServerInput = {
    id: string,
    name: string,
    x: number,
    y: number,
    type: 'player' | 'npc'
}

export abstract class Entity {

    // visual representation;
    public id: string;
    public name: string;
    private sprite: Sprite;
    private currentSpriteContainer: Container;

    private _position: Point ;
    private _speed: number = 0.5; // units = pixel per ms
    protected _pushBackSpeed: number = 1;
    private _velocity: Point ; // does not include push-back from others

    get speed() {
        return this._speed;
    }


    private _attackDuration: number = 500;
    private _blockDuration: number = 1000;

    private _attackCoolDownTime: number = 1000; // ms
    private _blockCoolDownTime: number = 2000;
    protected _statusEffects: Record<StatusEffectType, StatusEffect>
    

    constructor(id: string, name: string, sprite: Sprite) {
        this.id = id;
        this.name = name;

        this._position = new Point(0, 0);
        this._velocity = new Point(0, 0);

        this.sprite = sprite;
        this.currentSpriteContainer = new Container();
        this.currentSpriteContainer.addChild(this.sprite);

        // 0 duration status effect is considered empty
        
        this._statusEffects = Object.fromEntries(Object.values(StatusEffectType).map((value: StatusEffectType) => {
            return [StatusEffectType[value], new StatusEffect(0,0,StatusEffectType[value],0,0)]
        })) as Record<StatusEffectType, StatusEffect>
        
    }


    get position(): Point {
        return this._position;
    } 

    set position([x,y] : pointInput) {
        this._position.set(x, y);
        this.sprite.x = x;
        this.sprite.y = y;
    }

    get velocity() : Point {
        return this._velocity
    }

    set velocity([x,y] : pointInput) {
        this._velocity.set(x, y);
    }

    // update position
    public abstract move(deltaTime: number): void;

    public getStatusEffect(type: StatusEffectType) {
        const effect = this._statusEffects[type];
        if(!effect) {
            throw new Error(`Status effect ${type} not found.`);
        }
        return effect;
    }

    public applyStatusEffect(type: StatusEffectType, startTime: number, x: number, y: number, duration?: number) {
        // normalize direction:
        const vectorLength = Math.sqrt(x*x + y*y);

        this._statusEffects[type].startTime = startTime;
        this._statusEffects[type].duration = duration? duration : 200;
        this._statusEffects[type].direction = [x/vectorLength, y/vectorLength];

    }


    public resetStatusEffect(type: StatusEffectType) {
        // 0 duration is considered empty
        this._statusEffects[type].startTime = 0;
        this._statusEffects[type].duration = 0;
        this._statusEffects[type].direction = [0, 0];
    }


    // return what to render
    // includes movement direction and status effects 
    public getCurrentSprite(simulationTime: number) {
        // temporary = static sprite
        return this.sprite;
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

        const extractedValues = this.extractValuesFromArrayBuffer(buffer);

        this.position = [...extractedValues.position];
        this.velocity = [...extractedValues.velocity];

        Object.values(StatusEffectType).forEach((type, index) => {
            this._statusEffects[type].startTime = extractedValues.statusEffects[type].startTime;
            this._statusEffects[type].duration = extractedValues.statusEffects[type].duration;
            this._statusEffects[type].direction = [...extractedValues.statusEffects[type].direction];
        });
    }

    private extractValuesFromArrayBuffer(buffer: ArrayBuffer) {
        // array buffer has same structure as toBufferView
        if(buffer.byteLength !== this.arrayBufferByteLength) {
            throw new Error(`Update array buffer has different length ${buffer.byteLength} than expected ${this.arrayBufferByteLength}`)
        }

        const bufferView = new Float64Array(buffer);

        let result : {
            position: [number, number],
            velocity: [number, number],
            statusEffects : Record<StatusEffectType,{startTime: number, duration: number, type: StatusEffectType, direction: [number,number]}>
        } =  {
            position: [bufferView[0], bufferView[1]],
            velocity: [bufferView[2], bufferView[3]],
            statusEffects: {} as Record<StatusEffectType,{startTime: number, duration: number, type: StatusEffectType, direction: [number,number]}>
        }

        Object.values( StatusEffectType ).forEach((value: StatusEffectType, index: number) => {
            result.statusEffects[value] = {
                startTime:  bufferView[4 + index * STATUS_EFFECT_LENGTH],
                duration:   bufferView[5 + index * STATUS_EFFECT_LENGTH],
                type: getStringEnumValue(StatusEffectType, bufferView[6 + index * STATUS_EFFECT_LENGTH] ),
                direction: [
                    bufferView[7 + index * STATUS_EFFECT_LENGTH],
                    bufferView[8 + index * STATUS_EFFECT_LENGTH]
                ]
            }
        })

        return result;
    }

    public interpolateFromBuffers(time: number, secondLatest : {time: number, value: ArrayBuffer}, latest:  {time: number, value: ArrayBuffer}){

        const secondLatestValues = this.extractValuesFromArrayBuffer(secondLatest.value);
        const latestValues = this.extractValuesFromArrayBuffer(latest.value);

        if(time > latest.time) {
            // if time > last buffer (including delay): 
            // extrapolate = same status, constant velocity
            const delta = time - latest.time ;
            this.position = [
                latestValues.position[0] + delta * latestValues.velocity[0],
                latestValues.position[1] + delta * latestValues.velocity[1]
            ];

            Object.values( StatusEffectType ).forEach((value: StatusEffectType, index: number) => {
                this._statusEffects[value].startTime = latestValues.statusEffects[value].startTime;
                this._statusEffects[value].duration = latestValues.statusEffects[value].duration;
                this._statusEffects[value].direction = [...latestValues.statusEffects[value].direction];
            });


        } else if (time <= latest.time && time >= secondLatest.time) {
            // if time < last buffer:
            // interpolate = linear position / velocity between two times
            // status effects: look at both frames, choose one where non-zero duration (if any)
            const fraction = (time - secondLatest.time) / (latest.time - secondLatest.time);
            this.position = [
                secondLatestValues.position[0] +  fraction * (latestValues.position[0] - secondLatestValues.position[0]),
                secondLatestValues.position[1] +  fraction * (latestValues.position[1] - secondLatestValues.position[1])
            ];

            this.velocity = [
                secondLatestValues.velocity[0] +  fraction * (latestValues.velocity[0] - secondLatestValues.velocity[0]),
                secondLatestValues.velocity[1] +  fraction * (latestValues.velocity[1] - secondLatestValues.velocity[1])
            ];

            Object.values( StatusEffectType ).forEach((value: StatusEffectType, index: number) => {
                // prefer latest time statusEffect
                if(latestValues.statusEffects[value].duration > 0) {
                    this._statusEffects[value].startTime = latestValues.statusEffects[value].startTime;
                    this._statusEffects[value].duration = latestValues.statusEffects[value].duration;
                    this._statusEffects[value].direction = [...latestValues.statusEffects[value].direction];
                } else if(secondLatestValues.statusEffects[value].duration > 0) {
                    this._statusEffects[value].startTime = secondLatestValues.statusEffects[value].startTime;
                    this._statusEffects[value].duration = secondLatestValues.statusEffects[value].duration;
                    this._statusEffects[value].direction = [...secondLatestValues.statusEffects[value].direction];
                }
            });


        } else {
            // if time < secondLast buffer (should not happen too often)
            // use state = secondLast buffer
            // and assume constant velocity up to secondLast buffer 
            // negative time delta: delta < 0
            const delta = time - secondLatest.time;
            this.position = [
                secondLatestValues.position[0] + delta * secondLatestValues.velocity[0],
                secondLatestValues.position[1] + delta * secondLatestValues.velocity[1]
            ];

            Object.values( StatusEffectType ).forEach((value: StatusEffectType, index: number) => {
                this._statusEffects[value].startTime = secondLatestValues.statusEffects[value].startTime;
                this._statusEffects[value].duration = secondLatestValues.statusEffects[value].duration;
                this._statusEffects[value].direction = [...secondLatestValues.statusEffects[value].direction];
            });
        }

        // applied values different in all cases
        // velocity is not displayed = does not have to be updated

    }

    public interpolateValues(targetTime: number, before: bufferWithTime, after: bufferWithTime ) {
        const valuesBefore = this.extractValuesFromArrayBuffer(before.value);
        const valuesAfter = this.extractValuesFromArrayBuffer(after.value);

        const fraction = (targetTime - before.time) / (after.time - before.time);

        let result : {
            position: [number, number],
            velocity: [number, number],
            statusEffects : Record<StatusEffectType,{startTime: number, duration: number, type: StatusEffectType, direction: [number,number]}>
        } =  {
            position: [
                valuesBefore.position[0] + fraction * (valuesAfter.position[0] - valuesBefore.position[0]),
                valuesBefore.position[1] + fraction * (valuesAfter.position[1] - valuesBefore.position[1])
            ],
            velocity: [
                valuesBefore.velocity[0] + fraction * (valuesAfter.velocity[0] - valuesBefore.velocity[0]),
                valuesBefore.velocity[1] + fraction * (valuesAfter.velocity[1] - valuesBefore.velocity[1])
            ],
            statusEffects: {} as Record<StatusEffectType,{startTime: number, duration: number, type: StatusEffectType, direction: [number,number]}>
        }

        Object.values( StatusEffectType ).forEach((value: StatusEffectType, index: number) => {
            // default = use values before
            // values before used if non-zero duration at targetTime
            // duration should be longer than time difference = does not matter if we pick after/before
            if( valuesBefore.statusEffects[value].duration > 0 
                &&
                (valuesBefore.statusEffects[value].startTime + valuesBefore.statusEffects[value].duration >= targetTime)
            ) {
                result.statusEffects[value] = {...valuesBefore.statusEffects[value]};
            } else {
                result.statusEffects[value] = {...valuesAfter.statusEffects[value]};
            }
        });

        return result;

    }

    public serverReconciliation(server: bufferWithTime, before: bufferWithTime, after: bufferWithTime) {
        // interpolate values to serverTime
        if(!before.value || !after.value || !server.value) {
            return false;
        }
        if(! (before.time <= server.time && server.time <= after.time)) {
            throw new Error('Wrong order of times when server reconciliation called.')
        }

        const interpolatedValues = this.interpolateValues(server.time, before, after);

        const serverValues = this.extractValuesFromArrayBuffer(server.value);

        // compare extrapolated values with server values
        // condition to trigger server reconciliation =
        // 1. too much difference in positions
        // 2. difference in status effects
        const positionDifferenceThreshold = 5; // in px
        if(
            Math.abs(interpolatedValues.position[0] - serverValues.position[0]) > positionDifferenceThreshold
            ||
            Math.abs(interpolatedValues.position[1] - serverValues.position[1]) > positionDifferenceThreshold
            ||
            Object.values(StatusEffectType).reduce((statusEffectDifference, type) => {
                if( serverValues.statusEffects[type].duration > 0 
                    && 
                    interpolatedValues.statusEffects[type].duration <= 0
                ) {
                    return true || statusEffectDifference
                } else {
                    return false || statusEffectDifference
                }
            }, false)
           ) {
            // for testing:
            console.log(`Server values:`)
            console.log(serverValues)
            console.log(`Local interpolated values`)
            console.log(interpolatedValues);

            // set to server position (from the past)
            this.updateFromArrayBuffer(server.value);
            // next: update position to current time using commands from the buffer
            return true
           } else {
            return false;
           }

    }
}