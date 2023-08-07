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

    // find commands from startTime to endTime
    // split them into 'steps' time windows
    // null if no found
    // if multiple: take 1st command found
    public getCommandsWithinWindow(startTime: number, endTime: number, steps: number) {

        let commands : (ArrayBuffer | null)[] = [];

        for(let i = 0; i < steps; i++) {
            commands[i] = null;
        }
        
        const timePerStep = Math.floor((endTime - startTime) / steps );

        let currentNode = this.head;
        let start = startTime;
        let end = startTime + timePerStep;
        let index = 0;

        while(currentNode && currentNode.time <= endTime && index < steps) {
            
            if(currentNode.time < start) {
                // skip all commands from time before start
                currentNode = currentNode.next;
                continue;
            } else if(currentNode.time >= end) {
                // no command for window start-end
                commands[index] = null;
                index += 1;
                start += timePerStep;
                end += timePerStep;
                currentNode = currentNode.next;
            } else {
                // command found for start-end
                // take the 1st one found
                commands[index] = currentNode.command
                index += 1;
                start += timePerStep;
                end += timePerStep;
                currentNode = currentNode.next;
            }
        }

        return commands;
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