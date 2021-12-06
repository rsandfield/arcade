import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { AsteroidsGame } from './asteroids';

@Component({
  selector: 'app-asteroids',
  templateUrl: './asteroids.component.html',
  styleUrls: ['./asteroids.component.sass']
})
export class AsteroidsComponent implements OnInit {
  @ViewChild('canvas', { static: true })
  canvas?: ElementRef<HTMLCanvasElement>;
  game?: AsteroidsGame;
  stage = this.game?.stage;
  score = this.game?.score;
  lives = this.game?.lives;

  ngOnInit(): void {
    if(!this.canvas) throw new Error('Failed to get tetris game canvas');
    this.game = new AsteroidsGame(this.getCanvasContext(this.canvas));
  }
  
  /**
   * Extracts the context for the given canvas and sets the size appropriately
   * @param canvas Canvas context will be representing
   * @returns Context for the provided cavnas
   */
  getCanvasContext(canvas: ElementRef<HTMLCanvasElement>) {
    let context = canvas.nativeElement.getContext('2d');
    if(!context || !(context instanceof CanvasRenderingContext2D)) {
      throw new Error('Failed to get 2d context.');
    }
    return context;
  }

  /**
   * Begin a new game, clearing all data from a previous game if one was played
   */
  play(event: MouseEvent) {
    this.game?.play();
  }

  /**
   * Handles key press events for user input
   * @param event Key press event thrown by browser
   */
   @HostListener('window:keydown', ['$event'])
   @HostListener('window:keyup', ['$event'])
   keydownEvent(event: KeyboardEvent) {
      this.game?.keydownEvent(event);
   }
}