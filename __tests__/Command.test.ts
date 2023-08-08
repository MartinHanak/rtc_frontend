import { Command } from "@/app/[room]/Pixi/game/Command";

describe('Command class', () => {
    it('should have a set arrayBufferLength', () => {
        const testCommand = new Command(0,0,0,0,0,false,false);
        const length = testCommand.arrayBufferLength
        expect(length).toEqual(56);
    });
});