import { Vector } from "src/app/utility/vector";
import { clampLooping } from "../../../utility/utilities";
import { PI2 } from "../constants";

export class GameObject {
    constructor(
        public context: CanvasRenderingContext2D,
        public position: Vector,
        public velocity: Vector,
        public angle = 0,
        public angularSpeed = 0.1,
        public radius = 1
    ) {}

    move() {
        this.position = this.position.add(this.velocity);

        this.position.x = clampLooping(this.position.x, 0, this.context.canvas.width);
        this.position.y = clampLooping(this.position.y, 0, this.context.canvas.height);
    }

    turn(direction: number) {
        this.angle += clampLooping(direction * this.angularSpeed, 0, PI2);
    }

    update() {
        this.move();
    }

    checkCollision(object: GameObject) {
        let magnitudeSquared = this.position.subtract(object.position).magnitudeSquared();
        let radiiSumSquared = (this.radius + object.radius) ** 2;
        return magnitudeSquared < radiiSumSquared;
    }

    draw() {
        this.context.save();

        this.context.translate(this.position.x, this.position.y);
        this.context.rotate(this.angle);

        this.context.beginPath();
        this.context.arc(0, 0, this.radius, 0, PI2);
        this.context.lineTo(0, 0);
        this.context.stroke();

        this.context.restore();
    }
}