import { DisplayObject, Text } from "pixi.js";

export interface Overlay {
    texts: Text[]
    buttons?: DisplayObject[]
}