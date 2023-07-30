import { Point, Sprite } from "pixi.js";
import { pointInput } from "./Map";
import { Hitbox } from "../hitbox/Hitbox";

export class StaticAsset {
    private sprite: Sprite;
    private position: Point;
    private hitbox: Hitbox;

    constructor(sprite: Sprite, position: pointInput, hitbox: Hitbox) {
        this.sprite = sprite;
        this.position = new Point(position[0], position[1]);
        this.hitbox = hitbox;
    }
}