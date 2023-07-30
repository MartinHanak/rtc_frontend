import { pointInput } from "../object/Map";
import { Shape } from "./Shape";

export class Circle extends Shape {

    private radius: number;

    constructor(center: pointInput, radius: number) {
        super(center);
        this.radius = radius;
    }
}