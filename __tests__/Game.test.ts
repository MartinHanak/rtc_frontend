import { Map } from "@/app/[room]/Pixi/object/Map";
jest.mock('../src/app/[room]/Pixi/object/Map');

import { Player } from "@/app/[room]/Pixi/entity/Player"
import { Npc } from "@/app/[room]/Pixi/entity/Npc"
import { Game } from "@/app/[room]/Pixi/game/Game"
import { Sprite } from "pixi.js"
import { pointInput } from "@/app/[room]/Pixi/object/Map"


const mockSprite = new Sprite()

const player1 = new Player('0','0',mockSprite);
const player2 = new Player('1','1',mockSprite);
const npc1 = new Npc('2','2',mockSprite);
const npc2 = new Npc('3','3',mockSprite);

const mapBoundaryPoints : pointInput[] = [[100,100],[100,900],[900,900],[900,100]];
const game = new Game(new Map(mapBoundaryPoints,mockSprite),[player1,player2],[npc1, npc2]);

describe('Game class', () => {
    beforeAll(() => {
        
    })

    it('should start at 0', () => {
        expect(game.time).toEqual(0)
    })

    it('should return correct player ids', () => {
        const ids = game.playerIds;

        expect(ids).toContain('0');
        expect(ids).toContain('1');
    })

    it('progressing game state increases the simulation time', () => {
        game.progressGameState(10);
        game.progressGameState(17);

        expect(game.time).toEqual(27);
    })

    it('should provide correct number of entities', () => {
        const number = game.entitiesNumber;

        expect(number).toEqual(4);
    })

    it('should return correct size of the entity array buffer', () => {
        const bufferLength = game.entityArrayBufferLength;

        expect(bufferLength).toEqual(152);
    })

    it('should return correct total size of the game array buffer', () => {
        const length = game.arrayBufferLength;

        // 4 entities + 1 time number
        // 1 number = 8 bytes
        expect(length).toEqual(616);
    })

    it('should have same values before and after converting to array buffer', () => {
        const buffer = game.toArrayBuffer();

        const positionBefore = game.getEntity('3').position;
        const velocityBefore = game.getEntity('2').velocity;

        game.updateFromArrayBuffer(buffer);

        const positionAfter = game.getEntity('3').position;
        const velocityAfter = game.getEntity('2').velocity;

        expect(positionBefore.x).toEqual(positionAfter.x);
        expect(positionBefore.y).toEqual(positionAfter.y);
        expect(velocityBefore.x).toEqual(velocityAfter.x);
        expect(velocityBefore.y).toEqual(velocityAfter.y)
    })


    afterAll(() => {

    })
})