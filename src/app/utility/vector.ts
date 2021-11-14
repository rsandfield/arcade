import { shortString } from "./utilities";

export class Vector {
    constructor(public x: number, public y: number) {}

    add(vector: Vector) {
        return new Vector(
            this.x + vector.x,
            this.y + vector.y
        );
    }

    subtract(vector: Vector) {
        return new Vector(
            this.x - vector.x,
            this.y - vector.y
        );
    }

    multiply(scalar: number) {
        return new Vector(
            this.x * scalar,
            this.y * scalar
        );
    }

    divide(scalar: number) {
        return new Vector(
            this.x / scalar,
            this.y / scalar
        );
    }

    rotate(radians: number) {
		let magnitude = this.magnitude();
		let angle = this.angle();
		return new Vector(
			magnitude * Math.cos(angle + radians),
			magnitude * Math.sin(angle + radians)
		);
	}

	angle() {
		return Math.atan2(this.y, this.x);
	}
	
	magnitudeSquared() {
		return Math.pow(this.x, 2) + Math.pow(this.y, 2);
	}
	
	magnitude() {
		return Math.pow(this.magnitudeSquared(), 0.5);
	}

    normalized() {
		let magnitude = this.magnitude();
		return new Vector(
			this.x / magnitude,
			this.y / magnitude
		);
	}

    dotProduct(vector: Vector) {
		return this.x * vector.x + this.y * vector.y;
	}
	
	crossProduct(vector: Vector) {
		return this.x * vector.y - this.y * vector.x;
	}
	
	toString() {
		return shortString(this.x, 5) + ", " + shortString(this.y, 5);
	}
}