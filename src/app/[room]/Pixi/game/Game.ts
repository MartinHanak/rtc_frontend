// holds most information about the game
// methods for LOCAL game update

import { Point } from "pixi.js";
import { Npc } from "../entity/Npc";
import { Player } from "../entity/Player";
import { Map } from "../object/Map";
import { Entity } from "../entity/Entity";

// Server is authoritative, Game has to make corrections if client and server disagree
export class Game {

    private simulationTime : number;

    // players and npcs, npcs at the end
    private entities : Entity[];

    private map; // background + boundaries + static assets

    private serverStateBuffer;
    private localStateBuffer;
    private localCommandsBuffer;

    constructor(map: Map, players: Player[], npcs: Npc[]) {
        this.map = map;

        this.entities = [...players, ...npcs]

        this.simulationTime = 0;

        this.initializeEntityPositions();
    }

    // set players on one big circle around the center of the map
    private initializeEntityPositions() {
        const entitiesNumber = this.entitiesNumber
        const centerPosition = new Point(0,0);
        const radius = 300;

        const anglePerEntity = Math.PI / entitiesNumber;

        for(let i = 0; i < entitiesNumber; i++) {
            let new_x = radius * Math.cos(anglePerEntity * i) + centerPosition.x;
            let new_y = radius * Math.sin(anglePerEntity * i) + centerPosition.y;

            this.entities[i].position =  [new_x, new_y];

        }
    }


    // game state received from server every x ms
    // frames between those state need to be interpolated
    // local player = client-side prediction used
    // remote player = interpolation used
    public getCurrentGameState(simulationTime: number) {
        // temporary:
        // use closest gameState from the buffer (no prediction / interpolation)

    } 

    public getCurrentFrame(simulationTime: number) {
        const gameState = this.getCurrentGameState(simulationTime);

        // using the gamestate update all objects in the current game

        // map will be static
        // need to update npc and player position + statusEffects
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