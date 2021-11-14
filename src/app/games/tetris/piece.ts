import { COLORS, SHAPES } from "./constants";

export class Piece {
    x = 0;
    y = 1;
    type = 0;
    rotation = 0;
    shape = new Array(1);

    constructor(private context: CanvasRenderingContext2D) {
        this.type = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
        this.reset(context);
    }

    spawn(context: CanvasRenderingContext2D) {
        this.context = context;
        this.x = 3;
        this.y = -2;
    }

    reset(context: CanvasRenderingContext2D) {
        this.shape = SHAPES[this.type];
        this.context = context;
        this.x = this.type == 4 ? 1 : 0;    // Square needs an offset
        this.y = 1;
        this.rotation = 0;
    }

    move(x: number, y: number) {
      this.x = x;
      this.y = y;
    }

    rotateTo(rotation: number) {
        console.log(rotation);
        while(rotation > 0) {
            this.rotate();
            rotation -= 1;
        }
    }

    swapFor(piece: Piece) {
        this.move(piece.x, piece.y);
        this.rotateTo(piece.rotation);
        this.context = piece.context;
    }

    rotate(clockwise: boolean = true) {
        let size = this.shape.length;
        let matrix = Array.from({length: size}, () => Array(size).fill(0));
        for(let x = 0; x < size; x++) {
            for(let y = 0; y < size; y++) {
                matrix[x][y] = this.shape[size - y - 1][x];
            }
        }
        this.shape = matrix;
        
        this.rotation += clockwise ? 1 : -1;        // Apply rotation
        this.rotation += this.rotation < 0 ? 4 : 0; // Check for negative value
        this.rotation -= this.rotation >= 4 ? 4 : 0;// Check for out of bounds
        
    }

    isEmpty(x: number, y: number): boolean {
        if(x < 0 || x > this.shape[0].length) return true;
        if(y < 0 || y > this.shape.length) return true;
        return this.shape[y][x] == 0;
    }

    draw() {
        this.shape.forEach((row, y) => {
            row.forEach((value: number, x: number) => {
                if(value > 0) {
                    drawBox(this.context, this.x + x, this.y + y, COLORS[this.type]);
                }
            });
        })
    }
}

function drawEdgeTrapezoid(context: CanvasRenderingContext2D, centerX: number, centerY: number, direction: number) {
    context.save();
    context.translate(centerX + 0.5, centerY + 0.5);

    // Presets, could have a settings paremeter fed into the function but whatever
    let ratio = 0.5;
    let inset = 0.8;
    let alpha = 0.5;

    let startX, startY, endX, endY: number;
    let color: string;
    switch(direction) {
        case 0:
            startX = -ratio;
            startY = -ratio;
            endX = ratio;
            endY = -ratio;
            color = "white";
            break;
        case 1:
            startX = ratio;
            startY = -ratio;
            endX = ratio;
            endY = ratio;
            color = "black";
            break;
        case 2:
            startX = -ratio;
            startY = ratio;
            endX = ratio;
            endY = ratio;
            color = "black";
            break;
        case 3:
            startX = -ratio;
            startY = -ratio;
            endX = -ratio;
            endY = ratio;
            color = "white";
            break;
        default:
            throw new Error("Could not assign bevel paramters to block");
    }

    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.lineTo(endX * inset, endY * inset);
    context.lineTo(startX * inset, startY * inset);
    context.closePath();

    context.fillStyle = color;
    context.globalAlpha = alpha;
    context.fill();

    context.restore();
}

export function drawBox(context: CanvasRenderingContext2D, x: number, y: number, color: string) {
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
    drawEdgeTrapezoid(context, x, y, 0);
    drawEdgeTrapezoid(context, x, y, 1);
    drawEdgeTrapezoid(context, x, y, 2);
    drawEdgeTrapezoid(context, x, y, 3);

}