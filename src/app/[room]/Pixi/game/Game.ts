// holds most information about the game
// methods for LOCAL game update

import { Container, Point, Sprite } from "pixi.js";
import { Npc } from "../entity/Npc";
import { Player } from "../entity/Player";
import { Map as GameMap } from "../object/Map";
import { Entity, EntityServerInput } from "../entity/Entity";
import { ArrayBufferBuffer } from "./ArrayBufferBuffer";
import { StatusEffectType } from "../entity/StatusEffect";
import { ServerInitializationData } from "./WebWorkerServer";

// Server is authoritative, Game has to make corrections if client and server disagree
export class Game {

    private simulationTime : number;
    private _serverDelay: number;
    get time() {
        return this.simulationTime;
    }

    // players and npcs, npcs at the end
    private localPlayerId: string;
    private localPlayerOrder: number;
    private entities: Map<string,Entity> ;

    private map : GameMap; // background + boundaries + static assets

    public serverStateBuffer : ArrayBufferBuffer;
    public localStateBuffer : ArrayBufferBuffer;
    public localCommandsBuffer : ArrayBufferBuffer;

    // 3 main parts of the game  = client-side prediction, enemy interpolation, server reconciliation 

    // things to check:
    // client-side prediction
    // - local player should move smoothly (occasional jumps = server reconciliation)
    // - local player is in the future compared to the server state
    get clientPredictionTimes() {
        let serverTime =  this.serverStateBuffer.lastInsertedTime?  this.serverStateBuffer.lastInsertedTime : 0;
        let latestCommands = this.localCommandsBuffer.getTwoLatestValues();
        let frameTime = latestCommands? latestCommands[1].time - latestCommands[0].time : 0;
        return {
            relativeToServer: this.time - serverTime,
            frameTime: frameTime
        }
    }

    // enemy interpolation
    // - enemies are displayed with slight delay (state from the past)
    // - delay should be such that their state is interpolated between 2 last game states
    // - occasionally enemy can be extrapolated slighly into the future (relative to the last game state received)
    get interpolationTimes() {
        let times = {
            serverSecondLatest: 0,
            serverLatest: 0,
            serverDelay: this._serverDelay,
            interpolationCombinedDelay: this._serverDelay + this.serverStateDelta
        }

        let lastTwoStates = this.serverStateBuffer.getTwoLatestValues()
        if(lastTwoStates) {
            times.serverSecondLatest = lastTwoStates[0].time,
            times.serverLatest = lastTwoStates[1].time
        }

        return times;
    }

    // server reconciliation
    // - due to variable frame times, server reconciliation can be observed even if other players do not interact with local player
    // - local state (from the past) is compared with game state received from the server
    // - if too big of difference = local player corrected
    public lastServerReconciliationTriggered: number = 0;

    constructor(map: GameMap, localPlayerId: string, players: Player[], npcs: Npc[]) {
        this.map = map;

        this.localPlayerId = localPlayerId;

        // sort input players 
        // so that input order does not matter
        players.sort((a,b) => {return a.id > b.id ? 1 : -1})

        this.entities = new Map<string,Entity>();
        players.forEach((player,index) => {
            this.entities.set(player.id, player);

            if(player.id === this.localPlayerId) {
                this.localPlayerOrder = index;
                console.log(`Local player: ${player.id}`);
            }
        })
        npcs.forEach((npc) => {
            this.entities.set(npc.id, npc);
        })

        this.simulationTime = 0;
        this._serverDelay = 100;
        this.initializeEntityPositions();

        this.localCommandsBuffer = new ArrayBufferBuffer();
        this.localStateBuffer = new ArrayBufferBuffer();
        this.serverStateBuffer = new ArrayBufferBuffer();
    }

    // set players on one big circle around the center of the map
    private initializeEntityPositions() {
        const entitiesNumber = this.entitiesNumber
        const centerPosition = new Point(500,300);
        const radius = 100;

        const anglePerEntity = 2 *  Math.PI / entitiesNumber;

        let i = 0;
        this.entities.forEach((entity) => {
            let new_x = radius * Math.cos(anglePerEntity * i) + centerPosition.x;
            let new_y = radius * Math.sin(anglePerEntity * i) + centerPosition.y;

            entity.position = [new_x, new_y];
            i += 1;
        });
    }

    get playerIds() {
        const ids : string[] = [];

        this.entities.forEach((entity) => {
            if(entity instanceof Player) {
                ids.push(entity.id);
            }
        })

        return ids;
    }

    public getEntity(id: string) {

        const entity = this.entities.get(id);

        if(!entity) {
            throw new Error(`Entity with the required id: ${id} not found.`);
        }

        return entity;
    }

    // given current game state 
    // update to (previous time + time) game state
    public progressGameState(time: number) {
        // reset old status effects 
        this.resetStatusEffects();

        // hit registration
        this.hitRegistration();

        // update player sprites / do automatically on status update
        
        // movement
        this.moveEntities(time);

        // other...
        // update time
        this.simulationTime = this.simulationTime + time;
    }

    private resetStatusEffects() {
        this.entities.forEach((entity) => {
            Object.values(StatusEffectType).forEach((type) => {

                const oldStatus = entity.getStatusEffect(type);

                if(oldStatus.startTime + oldStatus.duration < this.time) {
                    entity.resetStatusEffect(type);
                }
            })
        })
    }

    private hitRegistration() {
        const radiusSquaredThreshold = 400;
        this.entities.forEach((entity) => {
            if( entity.getStatusEffect(StatusEffectType.ATTACK).duration > 0
                &&
                entity.getStatusEffect(StatusEffectType.ATTACK).startTime <= this.time
                &&
                entity.getStatusEffect(StatusEffectType.ATTACK).startTime
                + entity.getStatusEffect(StatusEffectType.ATTACK).duration >= this.time
            ) {
            // apply pushback to targets in range

                this.entities.forEach((hitEntity) => {
                    if(hitEntity.id !== entity.id) {
                        if(
                            (hitEntity.position.x - entity.position.x) * (hitEntity.position.x - entity.position.x)
                           +
                           (hitEntity.position.y - entity.position.y) * (hitEntity.position.y - entity.position.y)
                           <
                           radiusSquaredThreshold
                        ) {
                            // TODO: check direction of the attack too
                            hitEntity.applyStatusEffect(
                                StatusEffectType.PUSHBACK,
                                this.time,
                                hitEntity.position.x - entity.position.x,
                                hitEntity.position.y - entity.position.y,
                                1000
                            );

                        }
                    }
                })
            }
        })
    }

    private moveEntities(time: number) {
        this.entities.forEach((entity) => {
            entity.move(time);
        })
    } 


    // client-side only function
    // use server state buffer to interpolate non-local entities
    // updates their values from 2 buffered values (interpolated)
    // that is: non-local entities are shown in the past
    // for now assume delayTime will be constant during the whole game
    public interpolateNonLocalEntities(delayTime: number, localId: string) {

        // get LAST TWO BUFFERS
        const latestBuffers = this.serverStateBuffer.getTwoLatestValues();

        // not enough buffers = keep original state
        if(!latestBuffers) {
            return
        }

        // interpolate each entity using these 2 buffers
        const [secondLatest, latest] = latestBuffers;
        let index = 0;
        this.entities.forEach((entity) => {

            // local player uses client-side prediction
            if(entity.id !== localId) {
                entity.interpolateFromBuffers(
                    this.time - delayTime,
                    {
                        time: secondLatest.time,
                        value: this.sliceEntityBuffer(secondLatest.value, index)
                    }, {
                        time: latest.time,
                        value: this.sliceEntityBuffer(latest.value, index)
                    }
                );
            }
            index += 1;
        })
    }

    // order = insertion order into this.entities
    private sliceEntityBuffer(gameStateBuffer: ArrayBuffer, entityOrder: number) {
        // initial time = 8 bytes
        // each entity = this.entityArrayBufferLength bytes
        return gameStateBuffer.slice(
            8 + entityOrder * this.entityArrayBufferLength,
            8 + (entityOrder + 1) * this.entityArrayBufferLength
        );
    }

    // approximates server delay = time between last two game states from the server
    get serverDelay() {
        return this._serverDelay;
    }

    // set delay as approximate running average
    set serverDelay(delay: number) {
        
        let runningAverage = this.serverDelay - this.serverDelay / 100;
        runningAverage += delay / 100;

        this._serverDelay =  runningAverage;
    }

    get serverStateDelta() {
        const buffers = this.serverStateBuffer.getTwoLatestValues();
        let serverStateDelta = 0;
        if(buffers) {
            serverStateDelta = (buffers[1].time - buffers[0].time)*0.9;
        }
        return serverStateDelta;
    }

    // assume that current Game values = values for the render frame
    public getCurrentFrame() : Container {
        console.log('Current frame');

        const container = this.map.getCurrentFrame();
        container.x = 0;
        container.y = 0;


        // using the gamestate update all objects in the current game

        // map will be static
        // need to update npc and player position + statusEffects
        this.entities.forEach((entity) => {
            container.addChild(entity.getCurrentSprite(0))
        })

        console.log(container)
        return container;
    }

 

    get entitiesNumber() {
        return this.entities.size;
    }

    get entityArrayBufferLength() {
        // assume: all entities same length
        const iterator = this.entities.values();
        const testEntity = iterator.next().value;

        if(!testEntity || !(testEntity instanceof Entity)) {
            throw new Error(`Negative entity array length.`)
        }
        return testEntity.arrayBufferByteLength;
    }

    get arrayBufferLength() {
        // arrayBufferByteLength * number of entities
        // + 1 number = 8 bytes for simulation time
        return 8 + this.entitiesNumber * this.entityArrayBufferLength;
    }

    // convert game state for network transmission
    public toArrayBuffer() {
        const buffer = new ArrayBuffer(this.arrayBufferLength);
        const bufferView = new Float64Array(buffer)

        bufferView[0] = this.simulationTime;

        let index = 0;
        this.entities.forEach((entity) => {
            bufferView.set(
                entity.toBufferView(),
                Math.floor((8 + index * entity.arrayBufferByteLength) / 8)
            )
            index += 1;
        });

        return buffer;
    }

    public updateFromArrayBuffer(buffer: ArrayBuffer) {
        if(buffer.byteLength !== this.arrayBufferLength) {
            throw new Error(`Game incoming array buffer has different size: ${buffer.byteLength} than expected ${this.arrayBufferLength}`);
        }

        const bufferView = new Float64Array(buffer);

        this.simulationTime = bufferView[0];

        let index = 0;
        this.entities.forEach((entity) => {

            entity.updateFromArrayBuffer(
                this.sliceEntityBuffer(buffer, index)
            )

            index += 1;
        })
    }

    // runs when new game state arrives from the server
    // compare server state with local state (from the past)
    // if difference too big, update local player (given command from the past up to present)
    public serverReconciliation(serverTime: number, serverGameState: ArrayBuffer) {
        // find 2 closest local game state buffers
        const buffers = this.localStateBuffer.getBuffersAroundValue(serverTime);

        // if none found, do nothing
        if(!buffers || !buffers[0].value || !buffers[1].value) {
            if(serverTime > 1000) {
                throw new Error('No buffers found for server reconciliation')
            }
            return;
        }


        const update = this.getEntity(this.localPlayerId).serverReconciliation(
            {
                time: serverTime, 
                value: this.sliceEntityBuffer(serverGameState, this.localPlayerOrder)
            }, {
                time: buffers[0].time,
                value: buffers[0].value
            }, {
                time: buffers[1].time,
                value: buffers[1].value
            }       
        );

        // update player position from current position (server position from the past)
        // to present (using local commands from the buffer)
        if(update) {
            this.lastServerReconciliationTriggered = this.time;
            this.updateLocalPlayer(serverTime, this.time);
        }

        // discard old commands
        this.localCommandsBuffer.removeValuesUpto(serverTime - 1000);

        // discard old game state
        this.localStateBuffer.removeValuesUpto(serverTime - 1000);

    }

    private updateLocalPlayer(startTime: number, endTime: number) {
        const localPlayer = this.getEntity(this.localPlayerId) as Player;

        let currentTime = startTime;
        let delta = 0;

        let currentCommand = this.localCommandsBuffer.head;
        while(currentCommand) {
            // skip commands before startTime
            if(currentCommand.time < startTime) {
                currentCommand = currentCommand.next;
                continue;
            }


            delta = currentCommand.time - currentTime;
            currentTime = currentCommand.time;

            localPlayer.updateCurrentCommandFromArrayBuffer(currentCommand.value);
            localPlayer.applyCurrentCommand(this.time);
            localPlayer.move(delta);
            
            currentCommand = currentCommand.next;
        }

    }

    // return all data about the game (without sprites)
    // needed to start identical game on the server
    public getServerInitializationData() : ServerInitializationData {

        let initData = {
            mapBoundaryPoint: this.map.boundaryPointInput,
            localPlayerId: this.localPlayerId,
            entities: [] as EntityServerInput[]
        }

        this.entities.forEach((entity) => {
            initData.entities.push({
                id: entity.id,
                name: entity.name,
                x: entity.position.x,
                y: entity.position.y,
                type: (entity instanceof Player) ? 'player' : 'npc'
            })
        });

        return initData;
    }
}