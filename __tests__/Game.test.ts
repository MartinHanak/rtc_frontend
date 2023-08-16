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
const game = new Game(new Map(mapBoundaryPoints,mockSprite),'0',[player1,player2],[npc1, npc2]);

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

    it('should update player position correctly', () => {

        const playerOne = game.getEntity('0');
        const playerTwo = game.getEntity('1');

        playerOne.position = [0,0];
        playerOne.velocity = [0,0];

        playerTwo.position = [5,5];
        playerTwo.velocity = [0,0];

        if(!(playerOne instanceof Player) || !(playerTwo instanceof Player)) {
            throw new Error('should be a player')
        }

        playerOne.updateCurrentCommand(27,{up: false,down: false, right: true, left: false}, {attack: false, block: false});
        playerOne.applyCurrentCommand();
        playerTwo.updateCurrentCommand(27,{up: false,down: true, right: false, left: false}, {attack: false, block: false});
        playerTwo.applyCurrentCommand();


        const delta = 1;
        game.progressGameState(1);

        expect(playerOne.position.x).toEqual(playerOne.speed * delta);

        // progress without updating command = keep previous command

        game.progressGameState(1);
        expect(playerTwo.position.y).toEqual(playerTwo.speed * 2 + 5)

        
    })

    it('should not do server reconciliation if client prediction is correct', () => {
        const playerOne = game.getEntity('0');

        playerOne.position = [0,0];
        playerOne.velocity = [0,0];


        if(!(playerOne instanceof Player)) {
            throw new Error('should be a player')
        }

        playerOne.updateCurrentCommand(game.time,{up: false,down: false, right: true, left: false}, {attack: false, block: false});
        playerOne.applyCurrentCommand();


        //const initialGameState = game.toArrayBuffer();
        const initialTime = game.time;
        const initialCommand = playerOne.command;
        const initialPlayerState = playerOne.toBufferView().buffer;

        game.localCommandsBuffer.insert(initialTime,initialCommand);
        game.localStateBuffer.insert(initialTime, initialPlayerState);

        game.progressGameState(100);

        playerOne.updateCurrentCommand(game.time,{up: false,down: false, right: false, left: false}, {attack: false, block: false});
        playerOne.applyCurrentCommand();

        //const finalGameState = game.toArrayBuffer();
        const finalTime = game.time;
        const finalCommand = playerOne.command;
        const finalPlayerState = playerOne.toBufferView().buffer;

        game.localCommandsBuffer.insert(finalTime,finalCommand);
        game.localStateBuffer.insert(finalTime, finalPlayerState);

        expect(playerOne.position.x).toEqual(100* playerOne.speed);

        // server reconciliation
        const halfTime = initialTime + (finalTime - initialTime) / 2;
        playerOne.position = [
            0 + playerOne.speed * 50,
            0
        ]
        // model for correct server state
        const serverState = game.toArrayBuffer()

        // set playerOne back to final state
        playerOne.updateFromArrayBuffer(finalPlayerState);

        // when server state = interpolated local state = no server reconciliation 
        game.serverReconciliation(halfTime, serverState);

        // no change expected
        expect(playerOne.position.x).toEqual(100* playerOne.speed);


    })

    it('should do server reconciliation if client prediction is wrong', () => {
        const playerOne = game.getEntity('0');

        playerOne.position = [0,0];
        playerOne.velocity = [0,0];


        if(!(playerOne instanceof Player)) {
            throw new Error('should be a player')
        }

        playerOne.updateCurrentCommand(game.time,{up: false,down: false, right: true, left: false}, {attack: false, block: false});
        playerOne.applyCurrentCommand();


        //const initialGameState = game.toArrayBuffer();
        const initialTime = game.time;
        const initialCommand = playerOne.command;
        const initialPlayerState = playerOne.toBufferView().buffer;

        game.localCommandsBuffer.insert(initialTime,initialCommand);
        game.localStateBuffer.insert(initialTime, initialPlayerState);

        game.progressGameState(100);

        playerOne.updateCurrentCommand(game.time,{up: false,down: false, right: true, left: false}, {attack: false, block: false});
        playerOne.applyCurrentCommand();

        //const finalGameState = game.toArrayBuffer();
        const finalTime = game.time;
        const finalCommand = playerOne.command;
        const finalPlayerState = playerOne.toBufferView().buffer;

        game.localCommandsBuffer.insert(finalTime,finalCommand);
        game.localStateBuffer.insert(finalTime, finalPlayerState);

        expect(playerOne.position.x).toEqual(100* playerOne.speed);

        // server reconciliation = non matching server/client
        const halfTime = initialTime + (finalTime - initialTime) / 2;
        playerOne.position = [
            60,
            0
        ]
        // model for correct server state
        const serverState = game.toArrayBuffer()

        // set playerOne back to final state
        playerOne.updateFromArrayBuffer(finalPlayerState);

        // server reconciliation
        game.serverReconciliation(halfTime, serverState);

        //  change expected
        expect(playerOne.position.x).not.toEqual(100 * playerOne.speed);

        // expected value = server state + all commands starting from server state
        expect(playerOne.position.x).toEqual(60 + 50 * playerOne.speed);

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
    });




    afterAll(() => {

    })
})