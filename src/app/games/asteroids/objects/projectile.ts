import { Vector } from "src/app/utility/vector";
import { GameObject } from "./game-object";

export class Projectile extends GameObject {
    id = 0;

    constructor(context: CanvasRenderingContext2D, position: Vector, velocity: Vector, public hostile: boolean) {
        super(context, position, velocity, 0, 0, 5);
    }
}