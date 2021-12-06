import { clamp } from "src/app/utility/utilities";
import { Vector } from "src/app/utility/vector";
import { AsteroidsGame } from "../asteroids";
import { UFOSTATS } from "../constants";
import { GameObject } from "./game-object";
import { Projectile } from "./projectile";

export enum UFOSTATE {ALIVE, DEAD};
export class UFO extends GameObject {
    state = UFOSTATE.DEAD;

    maneuverTimer = 0;
    spawnTimer = 0;
    fireTimer = 0;

    maneuverRate = UFOSTATS[0].manueverRate;
    spawnRate = UFOSTATS[0].spawnRate;
    fireRate = UFOSTATS[0].fireRate;

    constructor(context: CanvasRenderingContext2D, private game: AsteroidsGame) {
        super(context, new Vector(0, 0), new Vector(0, 0), 0, 0, 10);
    }

    reset(level: number) {
        this.state = UFOSTATE.DEAD;
        this.spawnTimer = 0;
        this.fireTimer = 0;

        level = clamp(level, 0, UFOSTATS.length - 1);
        this.maneuverRate = UFOSTATS[level].manueverRate;
        this.spawnRate = UFOSTATS[level].spawnRate;
        this.fireRate = UFOSTATS[level].fireRate;
    }

    spawn() {
        this.state = UFOSTATE.ALIVE;
        this.maneuver();
        let edge = Math.floor(Math.random() * 4);
        let canvas = this.context.canvas;
        switch(edge) {
            case 0:
                this.position = new Vector(Math.random() * canvas.width, 0);
                break;
            case 1:
                this.position = new Vector(Math.random() * canvas.width, canvas.height);
                break;
            case 2:
                this.position = new Vector(0, Math.random() * canvas.height);
                break;
            case 3:
                this.position = new Vector(canvas.width, Math.random() * canvas.height);
                break;
        }
    }

    die() {
        this.state = UFOSTATE.DEAD;
        this.spawnTimer = 0;
        this.maneuverTimer = 0;
    }

    maneuver() {
        this.velocity = (new Vector(Math.random() - 0.5, Math.random() - 0.5)).normalized().multiply(5);
        this.maneuverTimer = 0;
    }

    override update() {
        if(this.state == UFOSTATE.ALIVE) {
            super.update();
            this.maneuverTimer += 1;
            this.fireTimer += 1;
            if(this.maneuverTimer > this.maneuverRate) {
                this.maneuver();
            }
            if(this.fireTimer > this.fireRate) {
                this.pew();
                this.fireTimer = 0;
            }
        }
        if(this.state == UFOSTATE.DEAD) {
            this.spawnTimer += 1;
            if(this.spawnTimer > this.spawnRate) {
                this.spawn();
            }
        }
    }

    pew() {
        if(!this.game || !this.game.ship) throw new Error("Cannot fire ze mizziles");
        let target = this.game.ship.position;
        let canvas = this.context.canvas;
        if(target.x - this.position.x < -canvas.width / 2) target.x -= canvas.width;
        if(target.x - this.position.x > canvas.width / 2) target.x += canvas.width;
        if(target.y - this.position.y < -canvas.height / 2) target.y -= canvas.height;
        if(target.y - this.position.y > canvas.height / 2) target.y += canvas.height;
        target = target.subtract(this.position).normalized();
        this.game.addProjectile(
            new Projectile(
                this.context,
                this.position.add(target.multiply(15)),
                target.multiply(3),
                true
            )
        );
    }

    override draw() {
        if(this.state == UFOSTATE.DEAD) return;

        this.context.save();

        this.context.translate(this.position.x, this.position.y);
        this.context.rotate(this.angle);

        // Body
        this.context.beginPath();
        this.context.ellipse(-5, -3, 24, 12, 0, -Math.PI * 1.5, -Math.PI * 1.15);
        this.context.ellipse(-5, 7, 24, 12, 0, Math.PI * 1.15, Math.PI * 1.5);
        this.context.ellipse(5, 7, 24, 12, 0, Math.PI * 1.5, Math.PI * 1.85);
        this.context.ellipse(5, -3, 24, 12, 0, -Math.PI * 1.85, -Math.PI * 1.5);
        this.context.closePath();

        // Line across the body
        this.context.moveTo(-24, 2);
        this.context.lineTo(24, 2);

        // Cockpit
        this.context.moveTo(-6, -5);
        this.context.arc(0, -5, 12, Math.PI, 2 * Math.PI);
        this.context.stroke();

        this.context.restore();
    }
}