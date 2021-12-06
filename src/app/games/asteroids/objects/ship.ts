import { Vector } from "src/app/utility/vector";
import { AsteroidsGame } from "../asteroids";
import { FIRERATE, IFRAMES } from "../constants";
import { GameObject } from "./game-object";
import { Projectile } from "./projectile";

export class Ship extends GameObject {
    fireTimer = 0;
    refresh = 0;

    thrusting = false;

    constructor(canvas: CanvasRenderingContext2D, private game: AsteroidsGame, position: Vector) {
        super(canvas, position, new Vector(0, 0), Math.PI, 0.1, 10 * Math.sqrt(2));
    }

    reset() {
        if(!this.context) throw new Error("Ship has no context.");
        this.position = new Vector(this.context.canvas.width / 2, this.context.canvas.height / 2);
        this.velocity = new Vector(0, 0);
        this.angle = Math.PI;
        this.fireTimer = 0;
        this.refresh = 0;
    }

    override update() {
        this.move();

        this.fireTimer += 1;
        this.refresh += 1;
    }

    thrust() {
        this.velocity = this.velocity.add(new Vector(0, 1 / 20).rotate(this.angle));
        this.thrusting = true;
    }

    pew() {
        if(this.fireTimer > FIRERATE) {
            this.velocity = this.velocity.subtract(new Vector(0, 1 / 30).rotate(this.angle));
            this.game.addProjectile(
                new Projectile(
                    this.context,
                    this.position.add((new Vector(0, 20)).rotate(this.angle)),
                    this.velocity.add((new Vector(0, 5)).rotate(this.angle)),
                    false
                )
            );
            this.fireTimer = 0;
        }
    }

    drawShip() {
        this.context.beginPath();
        this.context.moveTo(0, this.radius);
        this.context.lineTo(10, -10);
        this.context.lineTo(-10, -10);
        this.context.closePath();

        this.context.stroke();
    }

    drawShield() {
        this.context.beginPath();
        this.context.arc(0, 0, this.radius, 0, 2 * Math.PI);
        this.context.stroke();
    }

    drawPlume() {
        this.context.beginPath();
        this.context.moveTo(-8, -16);
        this.context.lineTo(8, -16);
        this.context.moveTo(-6, -22);
        this.context.lineTo(6, -22);
        this.context.moveTo(-4, -28);
        this.context.lineTo(4, -28);
        this.context.stroke();
        this.thrusting = false;
    }

    override draw() {
        this.context.save();

        this.context.translate(this.position.x, this.position.y);
        this.context.rotate(this.angle);

        this.drawShip();
        if(this.refresh < IFRAMES) this.drawShield();
        if(this.thrusting) this.drawPlume();

        this.context.restore();
    }
}