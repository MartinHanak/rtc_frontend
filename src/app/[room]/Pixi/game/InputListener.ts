import { Player } from "../entity/Player";

export type movementKeys = {
    up: boolean,
    down: boolean,
    right: boolean,
    left: boolean
}

export type statusKeys = {
    attack: boolean,
    block: boolean
}

export class InputListener {

    private movementKeys : movementKeys;
    private statusKeys: statusKeys;

    private keyDownListener : (e: KeyboardEvent) => void;
    private keyUpListener : (e: KeyboardEvent) => void;


    constructor() {

        this.movementKeys = {
            up: false,
            down: false,
            right: false,
            left: false
        }

        this.statusKeys = {
            attack: false,
            block: false
        }
    }

    public start() {
        this.keyDownListener = this.keyDownHandler.bind(this);
        this.keyUpListener = this.keyUpHandler.bind(this);

        window.addEventListener('keydown',  this.keyDownListener);
        window.addEventListener('keyup', this.keyUpListener);
    }

    private keyDownHandler(e: KeyboardEvent): void  {

        switch(e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.movementKeys.up = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.movementKeys.down = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.movementKeys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.movementKeys.right = true;
                break;
            case 'Space':
                this.statusKeys.attack = true;
                break;
            case 'KeyF':
                this.statusKeys.block = true;
                break;
        }
    } 

    private keyUpHandler(e: KeyboardEvent): void {
        switch(e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.movementKeys.up = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.movementKeys.down = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.movementKeys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.movementKeys.right = false;
                break;
            case 'Space':
                this.statusKeys.attack = false;
                break;
            case 'KeyF':
                this.statusKeys.block = false;
                break;
        }
    }

    public updatePlayerCommandFromLocalInput(player: Player, simulationTime: number) {
        player.updateCurrentCommand(
                simulationTime,
                this.movementKeys,
                this.statusKeys
            )
    }

    public stop() {
        window.removeEventListener('keydown', this.keyDownListener);
        window.removeEventListener('keyup', this.keyUpListener);
    }
}