import { Point, Sprite } from "pixi.js";
import { StaticAsset } from "./StaticAsset";

export type pointInput = [number, number];

export class Map {
    private staticAssets: StaticAsset[];
    private boundaryPoints: Point[];
    private backgroundImage: Sprite;

    constructor(boundaryPoint: pointInput[], background: Sprite, staticAssets: StaticAsset[]) {
        this.backgroundImage = background;
        this.staticAssets = staticAssets;
        this.boundaryPoints = [];
        boundaryPoint.forEach((pointInput) => {
            this.boundaryPoints.push(new Point(pointInput[0], pointInput[1]));
        })
    }

    // given one point return true/false if outside the map/not
    public isOutsideMap(coordinate: Point) {
        return false;
    } 
}