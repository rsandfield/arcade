export const PI2 = Math.PI * 2;
export const SCREEN_SIZE = 500;

export const STARTING_LIVES = 3;
export const FIRERATE = 10;
export const IFRAMES = 100;

export const ASTEROID_SIZE_MIN = 2;
export const ASTEROID_SPEED_MIN = 0.1;
export const ASTEROID_SPEED_MAX = 3;

export enum STATE {
    STOPPED,
    RUNNING,
    OVER
}

export class UfoStats {
    constructor(public spawnRate: number, public manueverRate: number, public fireRate: number) {}
}

export const UFOSTATS = [
    new UfoStats(1000, 50, 73)
];


export enum POINTS {
    ASTEROID = 100,
    UFO = 100
}