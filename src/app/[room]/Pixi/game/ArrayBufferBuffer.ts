export class ArrayBufferBuffer {
    private head: ListNode | null;
    private tail: ListNode | null;
    public bufferLength: number;
    public lastInsertedTime: number | null;

    // two latest values (values with highest time)
    // not removed when list updated
    // only updated with insert method
    private latest: ListNode | null;
    private secondLatest: ListNode | null;

    constructor() {
        this.head = null;
        this.tail = null;
        this.bufferLength = 0;
        this.lastInsertedTime = null;
    }

    public insert(time: number, value: ArrayBuffer) {
        let newNode = new ListNode(time,value);
        if(!this.tail ) {
            this.head = newNode;
            this.tail = this.head;
            this.bufferLength = 1;
        } else {
            this.tail.next = newNode;
            this.tail = this.tail.next;
            this.bufferLength += 1;
        }
        this.lastInsertedTime = time;

        // keep track of 2 latest added values
        if(!this.latest) {
            this.latest = newNode;
        }
        if(!this.secondLatest) {
            this.secondLatest = newNode;
        }

        if(time > this.latest.time) {
            this.secondLatest = this.latest;
            this.latest = newNode;
        } else if(time > this.secondLatest.time && time < this.latest.time) {
            this.secondLatest = newNode;
        }
    }

    // find values from startTime to endTime
    // split them into 'steps' time windows
    // null if nothing found for current step
    // if multiple: take 1st value found
    public getValuesWithinWindow(startTime: number, endTime: number, steps: number) {

        let values : (ArrayBuffer | null)[] = [];

        for(let i = 0; i < steps; i++) {
            values[i] = null;
        }

        const timePerStep = Math.floor((endTime - startTime) / steps );

        let currentNode = this.head;

        while(currentNode && currentNode.time <= endTime) {

            // skip all nodes outside startTime-endTime window
            if(currentNode.time < startTime || currentNode.time >= endTime) {
                currentNode = currentNode.next;
                continue;
            }
            // all other nodes: within startTime-endTime window
            let correspondingStepIndex = Math.floor((currentNode.time - startTime) / timePerStep);
            // only updates if not null
            // that is: takes 1st found value for given step if multiple values found
            if(!values[correspondingStepIndex]) {
                values[correspondingStepIndex] = currentNode.value;
            }

            // in all cases: go to the next node in the buffer
            currentNode = currentNode.next;
        }

        return values;
    }

    // remove all values up to the specified time
    public removeValuesUpto(time: number) {

        if(this.head === null) {
            return;
        }

        let currentNode : ListNode | null = this.head;

        while(currentNode) {
            let nextNodeCopy : ListNode | null = currentNode.next;

            // remove condition: look at the head OR the next node
            if(currentNode === this.head && currentNode.time < time) {
                nextNodeCopy  = currentNode.next;
                currentNode.next = null;
                this.head = nextNodeCopy;
                this.bufferLength -= 1;
            } else if(currentNode.next && currentNode.next.time < time) {
                nextNodeCopy = currentNode.next.next;
                currentNode.next.next = null;
                currentNode.next = nextNodeCopy;
                this.bufferLength -= 1;
            }

            // update tail / head / lastInsertedTime if length = 0 
            if(this.bufferLength === 0) {
                this.head = null;
                this.tail = null;
                this.lastInsertedTime = null;
            } 

            currentNode = nextNodeCopy;
        }
    }

    public getTwoLatestValues() {
        if(!this.latest || !this.secondLatest || this.latest.time === this.secondLatest.time) {
            return null;
        } else {
            return [{
                time: this.secondLatest.time,
                value: this.secondLatest.value
            }, {
                time: this.latest.time,
                value: this.latest.value
            }]
        }
    }

    // find 2 closest buffers around specified time
    // if no buffers around specified time found, return null
    public getBuffersAroundValue(inputTime: number) {

        if(!this.head) {
            return null;
        }

        let valueBefore : {time: number, value: null | ArrayBuffer} = {
            time: -Infinity,
            value: null
        }
        let valueAfter : {time: number, value: null | ArrayBuffer} = {
            time: Infinity,
            value: null
        }

        let current : ListNode | null = this.head;
        while(current) {
            if(current.time <= inputTime && current.time > valueBefore.time) {
                valueBefore.time = current.time;
                valueBefore.value = current.value;
            }

            if(current.time > inputTime && current.time < valueAfter.time) {
                valueAfter.time = current.time;
                valueAfter.value = current.value;
            }


            // optimization: if time too far, do not look further
            // do not look beyond 1000 ms after input time
            if(current.time - inputTime > 1000) {
                break;
            }

            current = current.next;
        }

        if(valueAfter.value && valueBefore.value) {
            return [valueBefore, valueAfter];
        } 
        
        return null;
        
    }
}


class ListNode {

    public next: ListNode | null;
    public time: number ;
    public value: ArrayBuffer ;

    constructor(time: number, value: ArrayBuffer, next?: ListNode | null) {
        this.time = time;
        this.value = value;
        this.next = next ? next : null;
    }
}