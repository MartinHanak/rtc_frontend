// holds most information about the game
// methods for LOCAL game update

import { Container, Point, Sprite } from "pixi.js";
import { Npc } from "../entity/Npc";
import { Player } from "../entity/Player";
import { Map as GameMap } from "../object/Map";
import { Entity } from "../entity/Entity";
import { ArrayBufferBuffer } from "./ArrayBufferBuffer";

// Server is authoritative, Game has to make corrections if client and server disagree
export class Game {

    private simulationTime : number;
    get time() {
        return this.simulationTime;
    }

    // players and npcs, npcs at the end
    private entities: Map<string,Entity> ;

    private map : GameMap; // background + boundaries + static assets

    public serverStateBuffer : ArrayBufferBuffer;
    // private localStateBuffer : GameStateBuffer;
    public localCommandsBuffer : ArrayBufferBuffer;

    constructor(map: GameMap, players: Player[], npcs: Npc[]) {
        this.map = map;

        // sort input players 
        // so that input order does not matter
        players.sort((a,b) => {return a.id > b.id ? 1 : -1})

        this.entities = new Map<string,Entity>();
        players.forEach((player) => {
            this.entities.set(player.id, player);
        })
        npcs.forEach((npc) => {
            this.entities.set(npc.id, npc);
        })

        this.simulationTime = 0;
        this.initializeEntityPositions();

        this.localCommandsBuffer = new ArrayBufferBuffer();
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
        // hit registration
        // movement
        this.entities.forEach((entity) => {
            entity.move(time);
        })
        // other...
        // update time
        this.simulationTime = this.simulationTime + time;
    }


    // game state received from server every x ms
    // frames between those state need to be interpolated
    // local player = client-side prediction used
    // remote player = interpolation used
    public getCurrentGameState(simulationTime: number) {
        // temporary:
        // use closest gameState from the buffer (no prediction / interpolation)

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

    // aproximates server delay = time between last two game states from the server
    get serverDelay() {
        const buffers = this.serverStateBuffer.getTwoLatestValues();

        if(!buffers) {
            return 0
        } else {
            return (buffers[1].time - buffers[0].time) / 2
        }
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
}