import { Point } from "pixi.js";
import { Shape } from "./Shape";

export class Hitbox {

    private shape: Shape

    constructor(shape: Shape) {
        this.shape = shape;
    }


    // assume: this Hitbox moved in specified direction
    // return vector that offsets collision (if there is collision)
    // offset is used later to shift this Hitbox in the (-direction)
    // null otherwise (no collision)
    getCollisionVectorWith(secondHitbox: Hitbox, direction?: Point) : [number, number] | null {

        return null
    }
    
}