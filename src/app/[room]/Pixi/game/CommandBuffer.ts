// buffer for user commands
// slightly different for server / client

import { Command } from "./Command";

// server has one-buffer for each user
export class CommandBuffer {


    // command buffer = linked list
    private head: ListNode | null;
    private tail: ListNode | null;
    public bufferLength: number ;
    public lastInsertedTime: number ;


    constructor() {
        this.bufferLength = 0
        this.lastInsertedTime = 0;

        let initialCommand = new Command(0,0,0,0,0,false,false);
        this.insertCommand(0, initialCommand.toArrayBuffer());
    }

    public insertCommand(time: number, command: ArrayBuffer) {
        if(!this.tail ) {
            this.head = new ListNode(time, command);
            this.tail = this.head;
            this.bufferLength = 1;
        } else {
            this.tail.next = new ListNode(time, command);
            this.bufferLength += 1;
        }
        this.lastInsertedTime = time;
    }

    // remove all commands up to the specified time
    public removeCommandsUpto(time: number) {
        if(this.head) {
            let currentNode : ListNode | null = this.head;
            while(currentNode) {
                // current node next can be modified if removed
                const nextReferenceCopy : ListNode | null = currentNode.next;

                if(currentNode.time < time) {
                    // if removed: head, length (potentially tail) have to be modified too
                    currentNode.next = null;

                    this.head = nextReferenceCopy;
                    this.bufferLength -= 1;

                    if(this.bufferLength === 0) {
                        this.tail = null;
                    }
                } else {
                    break;
                }

                currentNode = nextReferenceCopy;
            }
        }
    }
}


class ListNode {

    public next: ListNode | null;
    public time: number ;
    public command: ArrayBuffer ;

    constructor(time: number, command: ArrayBuffer, next?: ListNode | null) {
        this.time = time;
        this.command = command;
        this.next = next ? next : null;
    }
}