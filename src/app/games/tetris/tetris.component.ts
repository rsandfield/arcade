import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { BLOCK_SIZE, COLORS, COLS, LEVEL, LOSS_COLOR, MAX_COMBO, POINTS, ROWS, SHAPES } from './constants';
import { drawBox, Piece } from './piece';

enum STATE {STOPPED, RUNNING, OVER};

@Component({
  selector: 'app-tetris',
  templateUrl: './tetris.component.html',
  styleUrls: ['./tetris.component.sass']
})
export class TetrisComponent implements OnInit {
  // Gameboard
  @ViewChild('canvas', { static: true })
  board?: ElementRef<HTMLCanvasElement>;
  boardContext?: CanvasRenderingContext2D;

  // Next piece display
  @ViewChild('next', { static: true })
  next?: ElementRef<HTMLCanvasElement>;
  nextContext?: CanvasRenderingContext2D;

  // Game stats
  points = 0;
  lines = 0;
  level = 0;
  tetrisCombo = 0;
  time = { start: 0, elapsed: 0, level: 1000 };

  // Game state
  piece?: Piece;
  pieceNext?: Piece;
  state = STATE.STOPPED;
  cells: number[][] = this.getEmptyBoard();

  ngOnInit(): void {
    if(!this.board) throw new Error('Failed to get tetris game board canvas');
    this.boardContext = this.getCanvasContext(this.board, ROWS, COLS);

    if(!this.next) throw new Error('Failed to get tetris next piece canvas');
    this.nextContext = this.getCanvasContext(this.next, 4, 4);

    setInterval(this.update.bind(this), 1000.0/60.0);
  }

  /**
   * Extracts the context for a given canvas and sets the canvas to display a
   * grid of the given size
   * @param canvas Canvas context will be representing
   * @param rows Number of rows canvas will hold
   * @param cols Number of columns canvas will hold
   * @returns Context for the provided canvas
   */
  getCanvasContext(canvas: ElementRef<HTMLCanvasElement>, rows: number, cols: number) {
    let context = canvas.nativeElement.getContext('2d');
    if(!context || !(context instanceof CanvasRenderingContext2D)) {
      throw new Error('Failed to get 2d context.');
    }
    context.canvas.width = cols * BLOCK_SIZE;
    context.canvas.height = rows * BLOCK_SIZE;
    return context;
  }
  
  /**
   * Updates the game state and calls the draw function
   */
  update() {
    if(this.state == STATE.RUNNING) {
      let now = Date.now();
      this.time.elapsed = now - this.time.start;
      if(this.time.elapsed >= this.time.level) {
        this.time.start = now;
        this.drop();
      }
    }
    this.draw();
  }

  /**
   * Initialized an empty game board with the correct number of rows and columns
   * @returns 2D array of numbers to contain cell data
   */
  getEmptyBoard(): number[][] {
    return Array.from({length: ROWS}, () => Array(COLS).fill(0));
  }

  /**
   * Begin a new game, clearing all data from a previous game if one was played
   */
  play() {
    if(
      !this.boardContext || !(this.boardContext instanceof CanvasRenderingContext2D) ||
      !this.nextContext || !(this.nextContext instanceof CanvasRenderingContext2D)
    ) {
      throw new Error('This tetris game is without context!');
    }
    // Reset all game stats
    this.points = 0;
    this.lines = 0;
    this.level = 0;
    this.tetrisCombo = 0;
    this.time = { start: 0, elapsed: 0, level: 1000 };

    // Initialize pieces and game state
    this.cells = this.getEmptyBoard();
    this.pieceNext = new Piece(this.nextContext);
    this.piece = new Piece(this.boardContext);
    this.piece.spawn(this.boardContext);
    this.state = STATE.RUNNING;
  }

  /**
   * Handles ending the game
   */
  endGame() {
    this.state = STATE.OVER;
  }

  /**
   * Checks the game board for any complete rows, erasing them and assigning
   * points to the player based on combo count
   */
  checkScoring() {
    let rows:number[] = Array<number>(0);
    for(let y = ROWS - 1; y > 0; y--) {
      if(this.checkLine(y)) rows.push(y);
    }

    if(rows.length < 4) this.tetrisCombo = 0; // Reset tetris combo if broken
    
    // Assign points based on combo size
    switch(rows.length) {
      case 1:
        this.points += POINTS.SINGLE;
        break;
      case 2:
        this.points += POINTS.DOUBLE;
        break;
      case 3:
        this.points += POINTS.TRIPLE;
        break;
      case 4:
        this.points += POINTS.TETRIS * (this.tetrisCombo < MAX_COMBO ? this.tetrisCombo + 1 : MAX_COMBO);
        this.tetrisCombo += 1;
        break;
    }

    this.lines += rows.length;                // Add scored rows to total
    this.level = Math.floor(this.lines / 10); // Update level for new total
    this.time.level = LEVEL[this.level < LEVEL.length ? this.level : LEVEL.length - 1];
    
    this.deleteRows(rows);
  }

  /**
   * Checks if a given row of the game board is full or not
   * @param y Row index to check
   * @returns If row is full or not
   */
  checkLine(y: number) {
    if(!this.cells) throw new Error("Board not initialized.");
    for(let x = 0; x < COLS; x++) {
      if(this.cells[y][x] == 0) return false;
    }
    return true;
  }

  /**
   * Given an array of row indices, goes through the board and slides rows down
   * to cover the rows to be deleted and then generates new empty rows to fill
   * in the top 
   * @param rows
   */
  deleteRows(rows: number[]) {
    if(!this.cells) throw new Error("Board not initialized.");
    if(rows.length == 0) return;  // If array is empty, do nothing
    let row = 0;                  // Deletion row tracker

    // Slide up the board, shifting rows down to fill in deletions
    for(let slide = rows[row], y = rows[row]; y > 0;) {
      // Get next row to delete and increase amount of slide
      if(row < rows.length && slide == rows[row]) {
        row += 1;
        slide -= 1;
      } else {
        for(let x = 0; x < COLS; x++) {
          // Replace row with one slid down from higher on board
          if(slide >= 0) {
            this.cells[y][x] = this.cells[slide][x];
          }
          // Replace row with empty cells
          else {
            this.cells[y][x] = 0;
          }
        }
        y -= 1;
        slide -= 1;
      }
    }
  }

  /**
   * Check if the next position down is valid - dropping the piece if so;
   * freezing it in place, checking scoring, and spawning the next piece if not.
   */
  drop() {
    if(!this.piece) throw new Error("Piece not initialized.");

    let newPosition: Piece =  Object.create(this.piece);
    newPosition.y += 1;

    if(this.validPosition(newPosition)) {
      this.piece.move(newPosition.x, newPosition.y);
    } else {
      this.freeze();
      this.checkScoring();
      this.spawnPiece();
    }
  }

  /**
   * Spawns the next piece onto the board and generates a new next piece
   */
  spawnPiece() {
    if(!this.boardContext || !(this.boardContext instanceof CanvasRenderingContext2D)) {
      throw new Error('This tetris game is without context!');
    }
    if(!this.nextContext || !(this.nextContext instanceof CanvasRenderingContext2D)) {
      throw new Error('This tetris game is without context!');
    }
    this.piece = this.pieceNext;
    this.piece?.spawn(this.boardContext);
    this.pieceNext = new Piece(this.nextContext);
  }

  /**
   * Freezes the current piece on the board
   */
  freeze() {
    if(!this.piece) throw new Error("Piece not initialized.");
    if(!this.pieceNext) throw new Error("Piece not initialized.");

    let endGame = false;

    // Take each cell position from the piece and fix them to the board
    this.piece.shape.forEach((row, y) => {
      row.forEach((value: number, x: number) => {
        if(!this.piece) throw new Error("Piece not initialized.");
        if(value > 0) {
          this.cells[y + this.piece.y][x + this.piece.x] = value;
          if(!this.belowCeiling(y + this.piece.y)) endGame = true;
        }
      });
    });

    // Allow the game piece to finish freezing before ending the game
    if(endGame) this.endGame()
  }

  /**
   * Handles key press events for user input
   * @param event Key press event thrown by browser
   */
  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if(event.code.length > 2 &&  event.code[0] == "F") {
      return;
    } else {
      event.preventDefault();
    }
    if(!this.piece) throw new Error("Piece not initialized.");

    let newPosition: Piece =  Object.create(this.piece);

    let rotate = false;
    switch(event.code) {
      case "KeyA":
      case "ArrowLeft":
        newPosition.x -= 1;
        break;
      case "KeyD":
      case "ArrowRight":
        newPosition.x += 1;
        break;
      case "KeyW":
      case "ArrowUp":
        newPosition.rotate();
        rotate = true;
        break;
      case "KeyS":
      case "ArrowDown":
        newPosition.y += 1;
        if(this.validPosition(newPosition)) this.points += 1;
        break;
      case "Space":
        while(this.validPosition(newPosition)) {
          this.piece.move(newPosition.x, newPosition.y);
          newPosition.y += 1;
          this.points += 2;
        }
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.swapPieces();
        break;
    }

    if(this.validPosition(newPosition)) {
      this.piece.move(newPosition.x, newPosition.y);
      if(rotate) this.piece.rotate();
    }
  }

  /**
   * Swaps the current piece for the next one, storing the current piece as the
   * new next
   */
  swapPieces() {
    if(!this.boardContext || !(this.boardContext instanceof CanvasRenderingContext2D)) {
      throw new Error('This tetris game is without context!');
    }
    if(!this.nextContext || !(this.nextContext instanceof CanvasRenderingContext2D)) {
      throw new Error('This tetris game is without context!');
    }
    if(!this.pieceNext) throw new Error("Piece not initialized.");
    if(!this.piece) throw new Error("Piece not initialized.");

    let temp = this.piece;
    temp.shape = SHAPES[temp.type];
    this.piece = this.pieceNext;
    this.piece.swapFor(temp);
    this.pieceNext = Object.create(temp);   // Needed to prevent unintended behavior
    this.pieceNext?.reset(this.nextContext);
  }

  /**
   * Checks if a board grid cell is occupied
   * @param x Column index
   * @param y Row index
   * @returns Whether cell is occupied
   */
  notOccupied(x: number, y: number) {
    if(!this.cells) throw new Error("No board!");
    if(!this.belowCeiling(y)) return true;
    return this.cells[y][x] == 0;
  }

  /**
   * Checks if an x index is inside the game board walls
   * @param x Column index
   * @returns Whether index is in bounds
   */
  insideWalls(x: number) {
    return x >= 0 && x < COLS;
  }

  /**
   * Checks whether a y index is below the game board ceiling
   * @param y Row index
   * @returns Whether index is in bounds
   */
  belowCeiling(y: number) {
    return y > 0;
  }

  /**
   * Checks whether a y index is above the game board floor
   * @param y Row index
   * @returns Whether index is in bounds
   */
  aboveFloor(y: number) {
    return y < ROWS;
  }

  /**
   * Checks whether a theoretical piece can fit in its current coordinates
   * and rotation in the current board state
   * @param position Piece with position data to be checked
   * @returns Whether the piece can fit in that position
   */
  validPosition(position: Piece): boolean {
    return position.shape.every((row, y) => {
      return row.every((value: number, x: number) => {
        return(
          position.isEmpty(x, y) || (
          this.insideWalls(x + position.x) &&
          this.aboveFloor(y + position.y)  &&
          this.notOccupied(x + position.x, y + position.y)
        ));
      });
    });
  }

  /**
   * Draw the game canvases
   */
  draw() {
    this.drawBoard();
    this.drawNext();
  }

  /**
   * Draw the game board
   */
  drawBoard() {
    if(!this.boardContext || !(this.boardContext instanceof CanvasRenderingContext2D)) {
      throw new Error('This tetris game is without context!');
    }

    this.boardContext.clearRect(0, 0, this.boardContext.canvas.width, this.boardContext.canvas.height);
    this.boardContext.save();
    this.boardContext.scale(BLOCK_SIZE, BLOCK_SIZE);
    this.piece?.draw();

    // Draw filled cells
    if(!this.cells) throw new Error("No board!");
    for(let x = 0; x < COLS; x++) {
      for(let y = 0; y < ROWS; y++) {
        let value = this.cells[y][x];
        if(value > 0) drawBox(this.boardContext, x, y, COLORS[value]);
      }
    }
    this.boardContext.restore();

    drawLines(this.boardContext, ROWS, COLS);
    
    if(this.state == STATE.OVER) fillLoss(this.boardContext);
  }

  /**
   * Draw the next piece display
   */
  drawNext() {
    if(!this.nextContext || !(this.nextContext instanceof CanvasRenderingContext2D)) {
      throw new Error('This tetris game is without its next context!');
    }
    this.nextContext.clearRect(0, 0, this.nextContext.canvas.width, this.nextContext.canvas.height);
    this.nextContext.save();
    this.nextContext.scale(BLOCK_SIZE, BLOCK_SIZE);
    this.pieceNext?.draw();
    this.nextContext.restore();

    drawLines(this.nextContext, 4, 4);

    if(this.state == STATE.OVER) fillLoss(this.nextContext);
  }
}

/**
 * Draws lines to make a grid pattern on the given canvas
 * @param context Context of canvas lines will be drawn on
 * @param rows Height of board
 * @param cols Width of board
 */
function drawLines(context: CanvasRenderingContext2D, rows: number, cols: number) {
  context.save();
  context.strokeStyle = "black";
  context.lineWidth = 2;
  for(let i = 1; i < cols; i++) {
    context.beginPath();
    context.moveTo(i * BLOCK_SIZE, 0);
    context.lineTo(i * BLOCK_SIZE, rows * BLOCK_SIZE);
    context.stroke();
  }
  for(let i = 1; i < rows; i++) {
    context.beginPath();
    context.moveTo(0, i * BLOCK_SIZE);
    context.lineTo(cols * BLOCK_SIZE, i * BLOCK_SIZE);
    context.stroke();
  }
  context.restore();
}

/**
 * Fills in the given canvas with an overlay to show loss condition
 * @param context Context of canvas loss color will be painted on
 */
function fillLoss(context: CanvasRenderingContext2D) {
  context.save();
  context.fillStyle = LOSS_COLOR;
  context.globalAlpha = 0.5;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  context.restore();
}