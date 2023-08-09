import { Command } from "@/app/[room]/Pixi/game/Command";

describe('Command class', () => {
    it('should have a set arrayBufferLength', () => {
        const testCommand = new Command(0,0,0,0,0,false,false);
        const length = testCommand.arrayBufferLength
        expect(length).toEqual(56);
    });

    it('should have same values before and after ArrayBuffer conversion', () => {
        const testCommand = new Command(0,0,0,0,0,false,false);

        const buffer = testCommand.toArrayBuffer();

        testCommand.updateFromArrayBuffer(buffer);

        expect(testCommand.time).toEqual(0);
        expect(testCommand.direction.x).toEqual(0);
        expect(testCommand.direction.y).toEqual(0);
        expect(testCommand.velocity.x).toEqual(0);
        expect(testCommand.velocity.y).toEqual(0);
        expect(testCommand.status.ATTACK).toEqual(false);
        expect(testCommand.status.BLOCK).toEqual(false);
    });

    it('correctly updated from ArrayBuffer', () => {
        const testCommand  = new Command(0,0,0,0,0,false,false);
        const testCommand2 = new Command(1,2,3,4,5,true,true);

        const buffer = testCommand2.toArrayBuffer();

        testCommand.updateFromArrayBuffer(buffer);

        expect(testCommand.time).toEqual(1);
        expect(testCommand.direction.x).toEqual(2);
        expect(testCommand.direction.y).toEqual(3);
        expect(testCommand.velocity.x).toEqual(4);
        expect(testCommand.velocity.y).toEqual(5);
        expect(testCommand.status.ATTACK).toEqual(true);
        expect(testCommand.status.BLOCK).toEqual(true);

    })

    it('can be updated directly using updateCurrentCommand', () => {
        const testCommand  = new Command(0,0,0,0,0,false,false);

        testCommand.updateCurrentCommand(1,2,3,4,5,true,true);

        expect(testCommand.time).toEqual(1);
        expect(testCommand.direction.x).toEqual(2);
        expect(testCommand.direction.y).toEqual(3);
        expect(testCommand.velocity.x).toEqual(4);
        expect(testCommand.velocity.y).toEqual(5);
        expect(testCommand.status.ATTACK).toEqual(true);
        expect(testCommand.status.BLOCK).toEqual(true);
    })
});