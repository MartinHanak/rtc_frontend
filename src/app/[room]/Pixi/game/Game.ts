// holds most information about the game
// methods for LOCAL game update

import { Container, Point, Sprite } from "pixi.js";
import { Npc } from "../entity/Npc";
import { Player } from "../entity/Player";
import { Map } from "../object/Map";
import { Entity } from "../entity/Entity";
import { GameStateBuffer } from "./GameStateBuffer";
import { CommandBuffer } from "./CommandBuffer";

// Server is authoritative, Game has to make corrections if client and server disagree
export class Game {

    private simulationTime : number;

    // players and npcs, npcs at the end
    private entities : Entity[];

    private map; // background + boundaries + static assets

    private serverStateBuffer : GameStateBuffer;
   // private localStateBuffer : GameStateBuffer;
    private localCommandsBuffer : CommandBuffer;

    constructor(map: Map, players: Player[], npcs: Npc[]) {
        this.map = map;
        this.entities = [...players, ...npcs]
        this.simulationTime = 0;
        this.initializeEntityPositions();

        this.localCommandsBuffer = new CommandBuffer();
    }

    // set players on one big circle around the center of the map
    private initializeEntityPositions() {
        const entitiesNumber = this.entitiesNumber
        const centerPosition = new Point(500,300);
        const radius = 100;

        const anglePerEntity = 2 *  Math.PI / entitiesNumber;

        for(let i = 0; i < entitiesNumber; i++) {
            let new_x = radius * Math.cos(anglePerEntity * i) + centerPosition.x;
            let new_y = radius * Math.sin(anglePerEntity * i) + centerPosition.y;

            this.entities[i].position =  [new_x, new_y];

        }
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

    // given current game state 
    // update to (previous time + time) game state
    public progressGameState(time: number) {
        // hit registration
        // movement
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

    // assume that current Game values = values for the render frame
    public getCurrentFrame() : Container {
        console.log('Current frame');
        this.entities.forEach((entity) => {
            console.log(entity.position);
        })

        const container = this.map.getCurrentFrame();
        container.x = 0;
        container.y = 0;


        // using the gamestate update all objects in the current game

        // map will be static
        // need to update npc and player position + statusEffects
        for(const entity of this.entities) {
            container.addChild(entity.getCurrentSprite(0));
        }

        console.log(container)
        return container;
    }

 

    get entitiesNumber() {
        return this.entities.length;
    }

    get entityArrayBufferLength() {
        return this.entities[0].arrayBufferByteLength
    }

    get arrayBufferLength() {
        // arrayBufferByteLength * number of entities
        // + 1 for simulation time
        return 1 + this.entitiesNumber * this.entityArrayBufferLength;
    }

    // convert game state for network transmission
    public toArrayBuffer() {
        const buffer = new ArrayBuffer(this.arrayBufferLength);
        const bufferView = new Float64Array(buffer)

        bufferView[0] = this.simulationTime;

        for(let i = 0; i < this.entitiesNumber; i++) {
            bufferView.set(
                this.entities[i].toBufferView()
                , 1 + i * this.entityArrayBufferLength
            );
        }

        return buffer;
    }

    public updateFromArrayBuffer(buffer: ArrayBuffer) {
        if(buffer.byteLength !== this.arrayBufferLength) {
            throw new Error(`Game incoming array buffer has different size: ${buffer.byteLength} than expected ${this.arrayBufferLength}`);
        }

        const bufferView = new Float64Array(buffer);

        this.simulationTime = bufferView[0];

        for(let i = 0; i < this.entitiesNumber; i++) {

            this.entities[i].updateFromArrayBuffer(
                buffer.slice(1 + i * this.entityArrayBufferLength, 1 + (i + 1) * this.entityArrayBufferLength)
            )

        }

    }
}