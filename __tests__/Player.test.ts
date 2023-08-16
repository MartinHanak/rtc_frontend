import { Player } from "@/app/[room]/Pixi/entity/Player";
import { StatusEffectType } from "@/app/[room]/Pixi/entity/StatusEffect";
import exp from "constants";
import { Sprite } from "pixi.js";

const sprite = new Sprite()
const player = new Player("test", "test", sprite);

const player2 = new Player("test2", "test2", sprite);


describe('Command class', () => {
    it('should start at 0 0 position', () => {
        const initialPosition = player.position;

        expect(initialPosition.x).toEqual(0)
        expect(initialPosition.y).toEqual(0)
    })

    it('should return correct array buffer length for network transmission', () => {
        const length = player.arrayBufferByteLength;
        // position = 16, velocity = 16, 1 status effect = 40
        expect(length).toEqual(152)
    })

    it('should have same values before and after converting to array buffer', () => {

        player.position = [7,7];
        player.velocity = [13,13];



        const bufferView = player.toBufferView()
        const buffer = bufferView.buffer;

        player2.updateFromArrayBuffer(buffer);

        expect(player2.position.x).toEqual(player.position.x);
        expect(player2.position.y).toEqual(player.position.y);
        expect(player2.velocity.x).toEqual(player.velocity.x);
        expect(player2.velocity.y).toEqual(player.velocity.y);

    })

    it(' has same values before/after conversion to ArrayBuffer when status changes', () => {
        player.position = [7,7];
        player.velocity = [13,13];

        player.attack(77,1,1);
        player.block(33,-1,-1);
        player.applyPushBack(44,0,1,100);

        const buffer = player.toBufferView().buffer;

        player2.updateFromArrayBuffer(buffer);

        const newAttackStatus = player2.getStatusEffect(StatusEffectType.ATTACK);
        expect(newAttackStatus.startTime).toEqual(77)
        expect(newAttackStatus.direction.x).toEqual(1)
        expect(newAttackStatus.direction.y).toEqual(1)

        const newBlockStatus = player2.getStatusEffect(StatusEffectType.BLOCK);
        expect(newBlockStatus.startTime).toEqual(33)
        expect(newBlockStatus.direction.x).toEqual(-1)
        expect(newBlockStatus.direction.y).toEqual(-1)

        const newPushbackStatus = player2.getStatusEffect(StatusEffectType.PUSHBACK);
        expect(newPushbackStatus.startTime).toEqual(44)
        expect(newPushbackStatus.direction.x).toEqual(0)
        expect(newPushbackStatus.direction.y).toEqual(1)
        expect(newPushbackStatus.duration).toEqual(100)
    })

    it('should interpolate values for times between two buffers', () => {
        player.position = [0,0];
        player.velocity = [10,10];

        const timeOne = 0;
        const bufferOne = player.toBufferView().buffer;

        player.position = [100,100];
        player.velocity = [-45,0];

        const timeTwo = 10;
        const bufferTwo = player.toBufferView().buffer;

        player.interpolateFromBuffers(5,{time: timeOne, value: bufferOne}, {time: timeTwo, value: bufferTwo});

        expect(player.position.x).toEqual(50);
        expect(player.position.y).toEqual(50);
    });

    it('should extrapolate values to the future', () => {
        player.position = [0,0];
        player.velocity = [10,10];

        const timeOne = 0;
        const bufferOne = player.toBufferView().buffer;

        player.position = [100,100];
        player.velocity = [-45,0];

        const timeTwo = 10;
        const bufferTwo = player.toBufferView().buffer;

        player.interpolateFromBuffers(11,{time: timeOne, value: bufferOne}, {time: timeTwo, value: bufferTwo});

        expect(player.position.x).toEqual(55);
        expect(player.position.y).toEqual(100);
    })

    it('should extrapolate values to the past', () => {
        player.position = [0,0];
        player.velocity = [10,10];

        const timeOne = 0;
        const bufferOne = player.toBufferView().buffer;

        player.position = [100,100];
        player.velocity = [-45,0];

        const timeTwo = 10;
        const bufferTwo = player.toBufferView().buffer;

        player.interpolateFromBuffers(-1,{time: timeOne, value: bufferOne}, {time: timeTwo, value: bufferTwo});

        expect(player.position.x).toEqual(-10);
        expect(player.position.y).toEqual(-10);
    })

    it('can return correct interpolated values', () => {
        player.position = [0,0];
        player.velocity = [10,10];

        const timeOne = 0;
        const bufferOne = player.toBufferView().buffer;

        player.position = [100,50];
        player.velocity = [20,0];

        const timeTwo = 10;
        const bufferTwo = player.toBufferView().buffer;

        const interpolated = player.interpolateValues(5,{time: timeOne, value: bufferOne}, {time: timeTwo, value: bufferTwo});

        expect(interpolated.position[0]).toEqual(50);
        expect(interpolated.position[1]).toEqual(25);
        expect(interpolated.velocity[0]).toEqual(15);
        expect(interpolated.velocity[1]).toEqual(5);
    })

    it('correctly decides when server reconciliation is not needed', () => {
        // before
        player.position = [0,0];
        player.velocity = [10,10];

        const timeOne = 0;
        const bufferOne = player.toBufferView().buffer;

        // server
        player.position = [50,25];
        player.velocity = [15,5];
        const timeServer = 5;
        const serverBuffer = player.toBufferView().buffer;

        
        // after
        player.position = [100,50];
        player.velocity = [20,0];

        const timeTwo = 10;
        const bufferTwo = player.toBufferView().buffer;

        const needsUpdate = player.serverReconciliation({time: timeServer, value: serverBuffer}, {time:timeOne,value: bufferOne}, {time: timeTwo, value: bufferTwo});

        expect(needsUpdate).toBe(false);
        expect(player.position.x).toBe(100);

        // server 2 
        player.position = [50.5,24.5];
        player.velocity = [15,5];
        const timeServer2 = 5;
        const serverBuffer2 = player.toBufferView().buffer;

        const needsUpdate2 = player.serverReconciliation({time: timeServer2, value: serverBuffer2}, {time:timeOne,value: bufferOne}, {time: timeTwo, value: bufferTwo});

        expect(needsUpdate2).toBe(false);
    });

    it('correctly decides when server reconciliation is needed', () => {
        // before
        player.position = [0,0];
        player.velocity = [10,10];

        const timeOne = 0;
        const bufferOne = player.toBufferView().buffer;

        // server
        player.position = [55,25];
        player.velocity = [15,5];
        const timeServer = 5;
        const serverBuffer = player.toBufferView().buffer;

        
        // after
        player.position = [100,50];
        player.velocity = [20,0];

        const timeTwo = 10;
        const bufferTwo = player.toBufferView().buffer;

        const needsUpdate = player.serverReconciliation({time: timeServer, value: serverBuffer}, {time:timeOne,value: bufferOne}, {time: timeTwo, value: bufferTwo});

        expect(needsUpdate).toBe(true);
        expect(player.position.x).toEqual(55);
    })
})