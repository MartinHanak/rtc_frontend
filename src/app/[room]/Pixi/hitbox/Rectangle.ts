import { Point } from "pixi.js";
import { pointInput } from "../object/Map";
import { Shape } from "./Shape";

export class Rectangle extends Shape {

    private width: number;
    private height: number;
    private boundaryPoints: Point[];

    constructor(center: pointInput, width: number, height: number) {
        super(center);
        this.width = width;
        this.height = height;

        this.boundaryPoints = [];
        this.initializeBoundaryPoints();
    }

    private initializeBoundaryPoints() {
        this.boundaryPoints.push(new Point(this.center.x - this.width/2, this.center.y - this.height/2));
        this.boundaryPoints.push(new Point(this.center.x - this.width/2, this.center.y + this.height/2));
        this.boundaryPoints.push(new Point(this.center.x + this.width/2, this.center.y + this.height/2));
        this.boundaryPoints.push(new Point(this.center.x + this.width/2, this.center.y - this.height/2));
    }
}