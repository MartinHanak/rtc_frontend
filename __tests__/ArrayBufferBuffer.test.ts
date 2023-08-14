import { ArrayBufferBuffer } from "@/app/[room]/Pixi/game/ArrayBufferBuffer"


describe('ArrayBufferBuffer class', () => {

    it('should start empty', () => {
        const buffer = new ArrayBufferBuffer();

        expect(buffer.lastInsertedTime).toBe(null);
        expect(buffer.bufferLength).toEqual(0);
    })

    it('should insert ArrayBuffer correctly', () => {
        const buffer = new ArrayBufferBuffer();

        const input1 = new ArrayBuffer(8);
        const input2 = new ArrayBuffer(8);

        buffer.insert(3,input1);
        buffer.insert(10,input2);

        expect(buffer.lastInsertedTime).toBe(10);
        expect(buffer.bufferLength).toEqual(2);
    })

    it('should be able to remove values up to specified time', () => {
        const buffer = new ArrayBufferBuffer();

        const input = new ArrayBuffer(8);

        for(let i = 0; i < 10; i ++) {
            buffer.insert(i,input);
        }

        buffer.removeValuesUpto(5);

        expect(buffer.bufferLength).toEqual(5);
        expect(buffer.lastInsertedTime).toEqual(9);

        buffer.removeValuesUpto(10);

        expect(buffer.bufferLength).toEqual(0);
        expect(buffer.lastInsertedTime).toEqual(null);
    })

    it('should return values from specified time window', () => {
        const buffer = new ArrayBufferBuffer();

        const input = new ArrayBuffer(8);

        for(let i = 0; i < 10; i ++) {
            buffer.insert(i,input);
        }

        const values = buffer.getValuesWithinWindow(0,10,10);

        for(const value of values) {
            expect(value).not.toBe(null)
        }

        buffer.removeValuesUpto(10);

        for(let i = 0; i < 10; i ++) {
            if(i !== 5 && i !== 6) {
                buffer.insert(i,input);
            }
        }

        const valuesWithGap = buffer.getValuesWithinWindow(0,10,10);

        expect(valuesWithGap[5]).toBe(null);
        expect(valuesWithGap[6]).toBe(null);
        
        valuesWithGap.forEach((value, i) => {
            if(i !== 5 && i !== 6) {
                expect(value).not.toBe(null);
            }
        })
        
    })

    it('returns correctly two latest values', () => {
        const buffer = new ArrayBufferBuffer();
        const input = new ArrayBuffer(8);

        expect(buffer.getTwoLatestValues()).toBe(null);

        buffer.insert(0, input);

        expect(buffer.getTwoLatestValues()).toBe(null);

        buffer.insert(1, input);

        const buffers= buffer.getTwoLatestValues();

        expect(buffers).not.toBe(null);

        if(buffers) {
            expect(buffers[0].time).toEqual(0);
            expect(buffers[1].time).toEqual(1);
        }
    })

})