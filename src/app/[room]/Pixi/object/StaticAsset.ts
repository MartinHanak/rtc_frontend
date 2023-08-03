import { Point, Sprite } from "pixi.js";
import { pointInput } from "./Map";
import { Hitbox } from "../hitbox/Hitbox";

export class StaticAsset {
    public sprite: Sprite;
    private _position: Point;
    private _hitbox: Hitbox;

    constructor(sprite: Sprite, position: pointInput, hitbox: Hitbox) {
        this.sprite = sprite;
        this._position = new Point(position[0], position[1]);
        this._hitbox = hitbox;
    }

    get position() : Point {
        return this._position;
    }

    set position([x,y]: pointInput) {
        this._position.set(x,y);
        this.sprite.x = x;
        this.sprite.y = y;
    }
}