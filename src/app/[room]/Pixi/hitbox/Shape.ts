import { Point } from "pixi.js";
import { pointInput } from "../object/Map";

export abstract class Shape {

    protected center: Point;

    constructor(center: pointInput) {
        this.center = new Point(center[0], center[1]);
    }
    
}