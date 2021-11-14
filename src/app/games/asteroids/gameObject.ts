import { Vector } from "src/app/utility/vector";
import { clamp, clampLooping } from "../../utility/utilities";
import { AsteroidsComponent } from "./asteroids.component";
import { ASTEROID_SIZE_MIN, FIRERATE, IFRAMES, PI2, UFOSTATS } from "./constants";

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

    update() {
        this.move();
        this.turn(1);
    }

    draw() {
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

export class Projectile extends GameObject {
    id = 0;

    constructor(context: CanvasRenderingContext2D, position: Vector, velocity: Vector, public hostile: boolean) {
        super(context, position, velocity, 0, 0, 5);
    }
}

export enum UFOSTATE {ALIVE, DEAD};
export class UFO extends GameObject {
    state = UFOSTATE.DEAD;

    maneuverTimer = 0;
    spawnTimer = 0;
    fireTimer = 0;

    maneuverRate = UFOSTATS[0].manueverRate;
    spawnRate = UFOSTATS[0].spawnRate;
    fireRate = UFOSTATS[0].fireRate;

    constructor(context: CanvasRenderingContext2D, private game: AsteroidsComponent) {
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

    update() {
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

    draw() {
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

export class Ship extends GameObject {
    fireTimer = 0;
    refresh = 0;

    thrusting = false;

    constructor(canvas: CanvasRenderingContext2D, private game: AsteroidsComponent, position: Vector) {
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

    update() {
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

    draw() {
        this.context.save();

        this.context.translate(this.position.x, this.position.y);
        this.context.rotate(this.angle);

        this.drawShip();
        if(this.refresh < IFRAMES) this.drawShield();
        if(this.thrusting) this.drawPlume();

        this.context.restore();
    }
}