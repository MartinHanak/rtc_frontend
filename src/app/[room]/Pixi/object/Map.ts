import { Container, Graphics, Point, Sprite } from "pixi.js";
import { StaticAsset } from "./StaticAsset";

export type pointInput = [number, number];

export class Map {
    private staticAssets: StaticAsset[];
    private boundaryPoints: Point[];
    private backgroundImage: Sprite;
    private graphics: Graphics;

    get boundaryPointInput() {
        let result : pointInput[] = [];
        for(const point of this.boundaryPoints) {
            result.push([point.x,point.y]);
        }
        return result
    }

    constructor(boundaryPoint: pointInput[], background: Sprite, staticAssets?: StaticAsset[]) {
        this.backgroundImage = background;
        this.staticAssets = staticAssets?  staticAssets : [] ;
        this.boundaryPoints = [];
        boundaryPoint.forEach((pointInput) => {
            this.boundaryPoints.push(new Point(pointInput[0], pointInput[1]));
        })

        this.graphics = this.initiateMapGraphics()
    }

    // given one point return true/false if outside the map/not
    public containsPoint(coordinate: Point) {
        return this.graphics.containsPoint(coordinate);
    } 

    public initiateMapGraphics() {
        const graphics = new Graphics();
        const startPoint = this.boundaryPoints[0]
        graphics.lineStyle(2, 0x000000, 1);
        graphics.beginFill(0xAA4F08);

        graphics.moveTo(startPoint.x, startPoint.y);
        for(let i = 1; i < this.boundaryPoints.length; i++) {
            graphics.lineTo(
                this.boundaryPoints[i].x,
                this.boundaryPoints[i].y
            )
        }
        graphics.lineTo(startPoint.x, startPoint.y);
        graphics.closePath();
        graphics.endFill();

        return graphics
    }

    // map is assumed to be static = no time argument needed
    public getCurrentFrame() {
        const container = new Container();

        this.staticAssets.forEach((asset) => {
            container.addChild(asset.sprite);
        })

        console.log(`Creating map`)
        console.log(this.boundaryPoints);

        container.addChild(this.graphics);
        container.addChild(this.backgroundImage);

        return container;
    }
}