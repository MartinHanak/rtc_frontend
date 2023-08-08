export class ArrayBufferBuffer {
    private head: ListNode | null;
    private tail: ListNode | null;
    public bufferLength: number;
    public lastInsertedTime: number | null;

    constructor() {
        this.head = null;
        this.tail = null;
        this.bufferLength = 0;
        this.lastInsertedTime = null;
    }

    public insert(time: number, value: ArrayBuffer) {
        if(!this.tail ) {
            this.head = new ListNode(time, value);
            this.tail = this.head;
            this.bufferLength = 1;
        } else {
            this.tail.next = new ListNode(time, value);
            this.tail = this.tail.next;
            this.bufferLength += 1;
        }
        this.lastInsertedTime = time;
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