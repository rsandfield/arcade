import { Vector } from 'src/app/utility/vector';
import { clamp, random } from 'src/app/utility/utilities';
import { ASTEROID_SIZE_MIN, ASTEROID_SPEED_MAX, ASTEROID_SPEED_MIN, IFRAMES, POINTS, SCREEN_SIZE, STARTING_LIVES, STATE } from './constants';
import { Asteroid } from './objects/asteroid';
import { Ship } from './objects/ship';
import { UFO, UFOSTATE } from './objects/ufo';
import { Projectile } from './objects/projectile';

export class AsteroidsGame {
    context: CanvasRenderingContext2D;

    state = STATE.STOPPED;
    stage = 0;
    score = 0;
    lives = STARTING_LIVES;

    map: Record<string, boolean> = {};
  
    ship?: Ship;
    ufo?: UFO;
    asteroids = new Array<Asteroid>();
    projectiles = new Array<Projectile>();

    constructor(context: CanvasRenderingContext2D) {
        this.context =  context;

        this.context.canvas.width = SCREEN_SIZE;
        this.context.canvas.height = SCREEN_SIZE;
        
        this.ship = new Ship(
            this.context, this,
            new Vector(this.context.canvas.width / 2, this.context.canvas.height / 2)
          );
      
          this.ufo = new UFO(this.context, this);
      
          this.checkAsteroids();
      
          setInterval(this.update.bind(this), 1000.0/60.0);
    }

  /**
   * Updates the game state and calls the draw function
   */
  update() {
    switch(this.state) {
      case STATE.RUNNING:
        this.handleInputRunning();
        this.updateObjects()
        this.checkProjectiles();
        this.checkAsteroids();
        break;
      case STATE.STOPPED:
        this.handleInputStopped();
        break;
    }
    this.draw();
  }

  updateObjects() {
    this.ship?.update();
    this.ufo?.update();
    this.projectiles.forEach(projectile => projectile.update());
    this.asteroids.forEach(asteroid => asteroid.update());
  }

  checkProjectiles() {
    this.projectiles.forEach(projectile => {
      //Check if any hostile projectile has hit the player ship
      if(projectile.hostile) {
        if(!this.ship) throw new Error("Ship isn't");
        if(projectile.checkCollision(this.ship)) {
          this.hitShip()
          this.removeProjectile(projectile);
        }
      }
      //Check if any player projectile has hit an asteroid
      else {
        if(!this.ufo) throw new Error("UFO isn't");
        this.asteroids.forEach(asteroid => {
          if(projectile.checkCollision(asteroid)) {
            this.hitAsteroid(projectile, asteroid);
          }    
        });
        //Check if any player projectile has hit the UFO
        if(projectile.checkCollision(this.ufo)) {
          this.hitUFO();
        }
      }
    });
  }

  checkAsteroids() {
    //Check if any asteroid has hit the player ship
    this.asteroids.forEach(asteroid => {
      if(this.ship?.checkCollision(asteroid)) {
        this.hitShip();
      }
    });

    //Check if all asteroids have been destroyed, starting the next stage if so
    if(this.asteroids.length == 0) {
      this.stage += 1;
      this.generateStage();
    }
  }

  /**
   * Begin a new game, clearing all data from a previous game if one was played
   */
  play() {
    this.context.canvas.focus();
    this.stage = 0;
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.generateStage();
  }

  /**
   * Handles ending the game
   */
  endGame() {
    this.state = STATE.OVER;
  }

  /**
   * Handles key press events for user input
   * @param event Key press event thrown by browser
   */
   keydownEvent(event: KeyboardEvent) {
      this.map[event.code] = event.type == "keydown";
   }
    
  handleInputRunning() {
    if(this.map["KeyW"] || this.map["ArrowUp"]) this.ship?.thrust();
    //if(this.map["KeyS"] || this.map["ArrowDown"])
    if(this.map["KeyA"] || this.map["ArrowLeft"]) this.ship?.turn(-1);
    if(this.map["KeyD"] || this.map["ArrowRight"]) this.ship?.turn(1);
    if(this.map["Space"]) this.ship?.pew();
  }

  handleInputStopped() {
    if(this.map["ShiftLeft"] || this.map["ShiftRight"]) this.state = STATE.RUNNING;
  }

  generateStage() {
    this.ship?.reset();
    this.ufo?.reset(this.stage);
    this.asteroids = [];
    this.projectiles = [];
    this.generateAsteroidField(this.stage * 5);
    this.state = STATE.STOPPED;
  }

  generateAsteroidField(totalSize: number) {
    while(totalSize > 0) {
      if(totalSize <= ASTEROID_SIZE_MIN) {
        this.generateAsteroid(ASTEROID_SIZE_MIN);
        totalSize = 0;
      } else {
        let size = Math.round(random(ASTEROID_SIZE_MIN, Math.log2(totalSize)));
        if(totalSize - size < ASTEROID_SIZE_MIN) size = totalSize;
        this.generateAsteroid(size);
        totalSize -= size;
      }
    }
  }

  generateAsteroid(size: number) {
    if(!this.context) throw new Error("No context.");
    if(!this.ship) throw new Error("Ship isn't");

    let speed = ASTEROID_SPEED_MIN + random(ASTEROID_SPEED_MIN, ASTEROID_SPEED_MAX);

    let tooClose = true;
    let position = new Vector(0, 0);
    while(tooClose) {
        position = new Vector(
            Math.random() * this.context.canvas.width,
            Math.random() * this.context.canvas.height
        );
        tooClose = position.subtract(this.ship.position).magnitude() < 100;
    }

    //Add the generated astroid to the game
    this.addAsteroid(new Asteroid(
        this.context,
        position,
        (new Vector(0, 1)).rotate(Math.random() * 2 * Math.PI).multiply(speed),
        (Math.random() - 1) / 5,
        size
    ));
  }

  addAsteroid(asteroid: Asteroid) {
    if(this.asteroids.length > 0) {
      asteroid.id = this.asteroids[this.asteroids.length-1].id + 1;
    }
    this.asteroids.push(asteroid);
  }

  /**
   * Removes an asteroid from the game
   */
  removeAsteroid(asteroid: Asteroid) {
      for(let i = 0; i < this.asteroids.length; i++) {
          if(this.asteroids[i].id == asteroid.id) {
              this.asteroids.splice(i, 1);
              break;
          }
      }
  }
  /**
   * Add a fully formed projectile to the game
   * @param {Projectile} projectile 
   */
  addProjectile(projectile: Projectile) {
      if(this.projectiles.length > 0) {
          projectile.id = this.projectiles[this.projectiles.length-1].id + 1;
      }

      this.projectiles.push(projectile);
  }

  /**
   * Removes a projectile from the game
   * @param {Projectile} projectile 
   */
  removeProjectile(projectile: Projectile) {
      for(let i = 0; i < this.projectiles.length; i++) {
          if(this.projectiles[i].id == projectile.id) {
              this.projectiles.splice(i, 1);
              break;
          }
      }
  }

  /**
   * Handles a collision between a projectile and asteroid, deleting both and
   * generating a pair of smaller asteroids if the hit asteroid is large enough
   * @param {Projectile} projectile 
   * @param {Asteroid} asteroid 
   */
  hitAsteroid(projectile: Projectile, asteroid: Asteroid) {
    if(!projectile.hostile) this.score += POINTS.ASTEROID;
    if(asteroid.size > 1) this.calve(projectile.velocity, asteroid);
    
    this.removeProjectile(projectile);
    this.removeAsteroid(asteroid);
  }

  calve(splitAxis: Vector, asteroid: Asteroid) {
    if(!this.context) throw new Error("No context.");
    this.addAsteroid(new Asteroid(
      this.context,
      asteroid.position.add(splitAxis.normalized().rotate(Math.PI/2).multiply(asteroid.size)),
      asteroid.velocity.add(splitAxis.rotate(Math.PI/8).divide(asteroid.size**2)),
      asteroid.angle,
      asteroid.size - 1
    ));
    this.addAsteroid(new Asteroid(
      this.context,
      asteroid.position.add(splitAxis.normalized().rotate(-Math.PI/2).multiply(asteroid.size)),
      asteroid.velocity.add(splitAxis.rotate(-Math.PI/8).divide(asteroid.size**2)),
      asteroid.angle,
      asteroid.size - 1
    ));
  }

  draw() {
    if(!this.context) throw new Error("No context.");
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    this.context.save();
    
    this.context.strokeStyle = "green";

    this.ship?.draw();
    this.ufo?.draw();
    this.projectiles.forEach(projectile => projectile.draw());
    this.asteroids.forEach(asteroid => asteroid.draw());
    
    this.context.restore();
  }

  /**
   * Handle the ship being hit and taking damage
   */
  hitShip() {
    if(!this.ship) throw new Error("Ship isn't");
    if(this.ship.refresh < IFRAMES) return;
    this.ship.refresh = 0;
    this.lives -= 1;
    if(this.lives <= 0) {
        this.state = STATE.OVER;
    }
  }

  /**
   * Handle the UFO being hit and taking damage
   */
  hitUFO() {
    if(!this.ufo) throw new Error("UFO isn't");
    
    if(this.ufo.state == UFOSTATE.ALIVE) {
        this.score += POINTS.UFO;
        this.lives += 1;
    }
    
    this.ufo.die();
  }
}