import { Vector } from "src/app/utility/vector";
import { ASTEROID_SIZE_MIN } from "../constants";
import { GameObject } from "./game-object";

export class Asteroid extends GameObject {
    id = 0;
    corners: number[] = [];

    constructor(
        context: CanvasRenderingContext2D,
        position: Vector,
        velocity: Vector,
        angularSpeed = 0.1,
        public size = ASTEROID_SIZE_MIN
    ) {
        super(context, position, velocity, 0, angularSpeed, 5 * (size + 1));

        for(let i = 0; i < (size + 2) * 2; i++) {
            this.corners[i] = this.radius * (0.9 + Math.random() / 5);
        }
    }

    override update() {
        this.move();
        this.turn(1);
    }

    override draw() {
        this.context.save();

        this.context.translate(this.position.x, this.position.y);
        this.context.rotate(this.angle);

        let cornerCount = this.corners.length;
        let corner = new Vector(0, this.corners[0]);
        this.context.moveTo(corner.x, corner.y);

        for(let i = 1; i < cornerCount; i++) {
            corner = new Vector(0, this.corners[i]).rotate(Math.PI * 2 * i / cornerCount);
            this.context.lineTo(corner.x, corner.y);
        }

        this.context.closePath();
        this.context.stroke();

        this.context.restore();
    }
}