var game;

/**
 * Wait for the page to be loaded to access HTML elements
 */
window.addEventListener("DOMContentLoaded", (event) => {
    landing = document.getElementById("landing");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");
});

/**
 * Start a new Mastermind game from user selected settings
 */
function startGame() {
    //Toggle displayed elements
    canvas.style.display = "block";
    landing.style.display = "none";

    //Initialize the game
    game = new MastermindGame(
        parseInt(settings['pegs'].value),   //Peg count
        parseInt(settings['colors'].value), //Color count
        parseInt(settings['turns'].value),  //Max turns
        settings['codemaker'].value == "computer",
        settings['codebreaker'].value == "computer"
    );

    //Add mouse event listeners
    canvas.addEventListener("mousemove", event => {game.trackMouse(event)});
    canvas.addEventListener("mousedown", event => {game.click(event)});

    //Start animation loop
    setInterval(frame, 1000.0/60.0);

    //Start game logic
    game.makeCode();
}

/**
 * Return player to landing page
 */
function endGame() {
    canvas.style.display = "none";
    landing.style.display = "block";
}

/**
 * Animation loop, simply calls game draw function
 */
function frame() {
    game.draw();
}

/**
 * Mastermind game class. Handles all inputs and logic to play a complete game
 */
class MastermindGame {
    //States game can be in, used to control logic and display
    static states = {'makeCode':0, 'play':1, 'codeBroken':2, 'codeSecure':3};
    //Possible peg colors
    static colors = ["blue", "red", "yellow", "green", "orange", "purple", "pink", "brown"];

    /**
     * Construct new Mastermind game from input parameters
     * @param {Number} pegCount 
     * @param {Number} colorCount 
     * @param {Number} turnCount 
     * @param {Boolean} computerMaker 
     * @param {Boolean} computerBreaker 
     */
    constructor(pegCount, colorCount, turnCount, computerMaker, computerBreaker) {
        //Store game parameters
        this.pegCount = clamp(pegCount, 1, 10);
        this.colorCount = clamp(colorCount, 1, 8);
        this.turnCount = turnCount > 0 ? turnCount : 0;
        this.turn = 0;
        this.state = MastermindGame.states.makeCode;
        this.computerMaker = computerMaker;
        this.computerBreaker = computerBreaker;
        this.submitCooldown = 0;

        //Configure canvas to fit game board
        canvas.height = this.turnCount * 30 + 130;
        canvas.width = this.pegCount * 39 + 113;

        //Initialize master code, will default to hidden
        this.code = new Code("C", 25, this.pegCount, this.colorCount);

        //Initialize the solver
        this.solver = new Solver(this);

        //Initialize the array of guess codes to match turns
        this.guesses = [];
        for(let i = 0; i < this.turnCount; i++) {
            this.guesses[i] = new Code(i+1, (i+2) * 30 + 27, pegCount, colorCount);
        }

        //Initialize game inputs
        this.inputs = [];
        for(let i = 0; i < this.pegCount; i++) {
            this.inputs[i] = new ButtonPeg(i, this);
        }
        this.newgame = new ButtonNewGame(this);
        this.submit = new ButtonSubmit(this);
        this.tray = new ButtonTray(this);

        //Initialize the color selection dots of the input selection group
        //TODO

        //Initialize fireworks
        this.fireworks = [];
        for(let i = 0; i < 20; i++) {
            this.fireworks[i] = new Firework();
        }
    }

    /**
     * Either call on the master code to randomize itself if using a computer
     * codemaker, or open the inputs to human input if not
     */
    makeCode() {
        if(this.computerMaker) {
            this.code.randomizeSelf();
            this.startBreaking();
        } else {
            this.state = MastermindGame.states.makeCode;
        }
    }

    /**
     * Either call on the solver to break the code if using a computer
     * codebreaker, or open the inputs to human input if not
     */
    startBreaking() { 
        if(this.computerBreaker) {
            this.code.display = true;
            this.solver.state = Solver.states.think;
            this.submit.hidden = true;
        }
        this.state = MastermindGame.states.play;
    }

    /**
     * Convert mouse position on page to position on canvas
     * @param {Event} event 
     * @returns {Object} x, y position relative to canvas 0, 0
     */
    canvasPosition(event) {
        let rect = canvas.getBoundingClientRect();
        let x = clamp(event.clientX - rect.left, 0, canvas.width);
        let y = clamp(event.clientY - rect.top, 0, canvas.height);
        return {x: x, y: y};
    }

    /**
     * Check the mouse position vs all buttons to see if it is over them
     * @param {Event} event 
     */
    trackMouse(event) {
        let position = this.canvasPosition(event);
        this.newgame.checkHover(position.x, position.y);
        this.submit.checkHover(position.x, position.y);
        this.tray.checkHover(position.x, position.y);
        for(let i = 0; i < this.pegCount; i++) {
            this.inputs[i].checkHover(position.x, position.y);
        }
    }

    /**
     * Check the mouse position vs all buttons to see if it has clicked them
     * @param {Event} event 
     */
    click(event) {
        let position = this.canvasPosition(event);
        this.newgame.checkClick(position.x, position.y);
        this.submit.checkClick(position.x, position.y);
        this.tray.checkClick(position.x, position.y);
        for(let i = 0; i < this.pegCount; i++) {
            this.inputs[i].checkClick(position.x, position.y);
        }
    }

    /**
     * Enter a code to either become the master code or be a guess
     * @param {Array} code 
     */
    submitCode(code) {
        //Prevent double click
        if(this.submitCooldown < 6) return;
        this.submitCooldown = 0;

        //Game over, do nothing
        if(this.state == MastermindGame.states.codeBroken || this.state == MastermindGame.states.codeSecure) {
            return;
        }

        //Human codemaker at game start, set code as master and start breaking
        if(this.state == MastermindGame.states.makeCode) {
            this.code.setPegs(code);
            this.startBreaking();
            return;
        }

        //Take turn
        if(this.state == MastermindGame.states.play) {
            this.guesses[this.turn].setPegs(code);
            let key = this.code.check(this.guesses[this.turn]); //Check guess
            this.guesses[this.turn].blacks = key[0];            //Save blacks
            this.guesses[this.turn].whites = key[1];            //Save whites
            this.guesses[this.turn].display = true;             //Show guess
            this.turn += 1;                                     //Progress turn counter

            //Code broken
            if(key[0] == this.code.pegs.length) {
                this.endGame(true);
            }
        }

        //Maximum turns exceeded, end game with code secure
        if(this.turn >= this.turnCount) {
            this.endGame(false);
            return;
        }
    }

    /**
     * End the game, display the master code, and prevent further input
     * @param {Boolean} broken 
     */
    endGame(broken) {
        this.code.display = true;
        this.submit.hidden = true;
        this.newgame.backgroundStyle = "#004400";

        if(broken) {
            this.state = MastermindGame.states.codeBroken;
        } else {
            this.state = MastermindGame.states.codeSecure;
        }
    }

    /**
     * Draw the game, calling on elements to do same
     */
    draw() {
        //Have computer codebreaker update its thought cycle
        if(this.computerBreaker) {
            this.solver.update();
        }

        this.submitCooldown += 1;

        //Clear the old frame
        context.clearRect(0, 0, canvas.width, canvas.height);

        //Start drawing
        context.save();

        //Draw background

        //Top bar
        context.beginPath();
        context.moveTo(1, 1);                   //Start
        context.lineTo(canvas.width - 80, 1);   //Cutout top
        context.lineTo(canvas.width - 80, 50);  //Cutout right
        context.lineTo(35, 50);                 //Cutout bottom
        context.lineTo(1, 16)                   //Cutout left
        context.closePath();

        //Guess box
        context.moveTo(67, 57);
        context.lineTo(this.pegCount * 30 + 69, 57);
        context.lineTo(this.pegCount * 30 + 69, canvas.height - 50);
        context.lineTo(67, canvas.height - 50);
        context.closePath();

        //Key box
        context.moveTo(this.pegCount * 30 + 75, 57);
        context.lineTo(canvas.width - 23, 57);
        context.lineTo(canvas.width - 1, 79)
        context.lineTo(canvas.width - 1, canvas.height - 50);
        context.lineTo(this.pegCount * 30 + 75, canvas.height - 50);
        context.closePath();

        //Guess marker box
        context.moveTo(43, 57);
        context.lineTo(60, 57);
        context.lineTo(60, canvas.height - 50);
        context.lineTo(1, canvas.height - 50);
        context.lineTo(1, 103);
        context.closePath();

        //Guess corner detail
        context.moveTo(1, 26);
        context.lineTo(33, 57);
        context.lineTo(1, 92);
        context.closePath();

        //Input box
        context.moveTo(1, canvas.height - 44);
        context.lineTo(canvas.width - 1, canvas.height - 43);
        context.lineTo(canvas.width - 1, canvas.height - 1);
        context.lineTo(30, canvas.height - 1);
        context.lineTo(1, canvas.height - 31);
        context.closePath();

        context.strokeStyle = "white";

        //Victory fill
        if(this.state == MastermindGame.states.codeBroken) {
            context.fillStyle = "#004400";
        }

        //Loss fill
        else if(this.state == MastermindGame.states.codeSecure) {
            context.fillStyle = "440000";
        }

        //Default fill
        else {
            context.fillStyle = "#222222";
        }

        context.fill();
        context.stroke();

        //Draw master code, all turns' guesses, and inputs
        this.code.draw();
        this.guesses.forEach(guess => {
            guess.draw();
        });
        for(let i = 0; i < this.pegCount; i++) {
            this.inputs[i].draw();
        };
        this.newgame.draw();
        this.submit.draw();
        this.tray.draw();

        //Draw fireworks. Has to go after codes because of layering.
        if(this.state == MastermindGame.states.codeBroken) {
            this.fireworks.forEach(firework => {
                if(firework.state == Firework.states.done) {
                    firework.pew();
                }
                firework.draw();
            });
        }

        context.restore();
    }
}

/**
 * Code class, remembers contents and positioning
 */
class Code {
    constructor(prefix, height, pegCount, colorCount) {
        //Display variables
        this.prefix = prefix;
        this.height = height;
        this.display = false;

        //Code memory
        this.pegs = [];
        this.pegs.length = pegCount;

        //Key results
        this.whites = 0;
        this.blacks = 0;

        //Color count array, for comparing keys
        this.colors = [];
        this.colors.length = colorCount;
        for(let i = 0; i < this.colors.length; i++) {
            this.colors[i] = 0;
        }
    }

    /**
     * Sets the code
     * @param {Array} code Array of peg color index values
     */
    setPegs(code) {
        //Reset color counts
        for(let i = 0; i < this.colors.length; i++) {
            this.colors[i] = 0;
        }

        this.pegs = code;

        //Count colors
        for(let i = 0; i < this.pegs.length; i++) {
            this.colors[this.pegs[i]] += 1;
        }
    }

    /**
     * Checks the code against another for how close they match
     * @param {Code} code to compare against
     */
    check(code) {
        //Count completely correct pegs
        let blacks = 0;
        for(let i = 0; i < this.pegs.length; i++) {
            if(this.pegs[i] == code.pegs[i]) {
                blacks += 1;
            }
        }

        let whites = 0;
        //Count correct colors preriod
        for(let i = 0; i < this.colors.length; i++) {
            //Maximized when both codes have equal values for a given color
            whites += Math.min(this.colors[i], code.colors[i]);
        }

        //Returned whites need to have blacks subtracted as they were included in count
        return [blacks, whites - blacks]
    }

    /**
     * Creates an array of length equal to the code with random values from
     * 0 (inclusive) to colorCount (exclusive)
     */
    randomizeSelf() {
        let code = [];
        let colorCount = this.colors.length;
        for(let i = 0; i < this.pegs.length; i++) {
            code[i] = Math.floor(Math.random() * colorCount);
        }
        this.setPegs(code);
    }

    /**
     * Draws the code. Pegs will be grayed out if display is false.
     */
    draw() {
        context.save();

        //Label
        context.fillStyle = "white";
        context.font = "20pt Ariel";
        context.fillText(this.prefix, 45 - context.measureText(this.prefix).width, this.height + 8);

        //Code display pegs
        for(let i = 0; i < this.pegs.length; i++) {
            context.strokeStyle = "white";
            context.lineWidth = "2px";
            if(this.display) {
                context.fillStyle = MastermindGame.colors[this.pegs[i]];
            } else {
                context.fillStyle = "gray";
            }
            context.beginPath();
            context.arc((i+1) * 25 + 65, this.height, 10, 0, 2 * Math.PI);
            context.fill();
            context.stroke();
        }

        //White key pegs
        for(let i = 0; i < this.whites; i++) {
            context.fillStyle = "white";
            context.strokeStyle = "black";
            context.lineWidth = "1px";
            context.beginPath();
            context.arc(this.pegs.length * 25 + 110 + i * 14, this.height - 7, 5, 0, 2 * Math.PI);
            context.fill();
            context.stroke();
        }

        //Black key pegs
        for(let i = 0; i < this.blacks; i++) {
            context.fillStyle = "black";
            context.strokeStyle = "white";
            context.lineWidth = "1px";
            context.beginPath();
            context.arc(this.pegs.length * 25 + 110 + i * 14, this.height + 7, 5, 0, 2 * Math.PI);
            context.fill();
            context.stroke();
        }

        context.restore();
    }
}

/**
 * The solver handles all logic for iteratively guessing codes until a solution
 * is reached by elimination.
 */
class Solver {
    static states = {sleep:0, think:1, input:2, submit:3};
    
    constructor(game) {
        this.game = game;

        this.guess = [];
        this.state = Solver.states.sleep;
        this.index = 0;
        this.clock = 0;

        //Build color index array;
        let colors = [];
        for(let i = 0; i < game.colorCount; i++) {
            colors[i] = i;
        }

        this.fullSet = this.permutePossibleGuesses(game.pegCount, colors);
        this.remaining = [...this.fullSet];
    }

    /**
     * Recursively assemble all possible codes
     * @param {Number} pegCount Number of pegs not already assigned
     * @param {Array} colors    Array of color indecies
     */
    permutePossibleGuesses (pegCount, colors) {
        if(pegCount <= 1 || isNaN(pegCount)) {
            return colors;
        }
        let suffixes = this.permutePossibleGuesses(pegCount - 1, colors);
        let outcart = [];
        colors.forEach(color => {
            suffixes.forEach(suffix => {
                outcart.push([color].concat(suffix));
            });
        });
        return outcart;
    }
    
    /**
     * Take actions based on clock cycle and game state:
     *  Nothing if sleeping or done
     *  Wait if action taken recently
     *  Make a guess from the remaining possible codes
     *  Perform input actions based on active guess
     */
    update () {
        //Do nothing
        if(this.state == Solver.states.done || this.state == Solver.states.sleep) {
            return;
        }

        //Wait
        if(this.clock < 20) {
            this.clock += 1;
            return;
        }

        //Game over
        if(this.game.state == MastermindGame.states.codeBroken || this.game.state == MastermindGame.states.codeSecure) {
            this.state = Solver.states.done;
            return;
        }
        
        //Reset clock
        this.clock = 0;

        switch(this.state) {
            //Make a new guess
            case Solver.states.think:
                this.makeGuess();
                this.state = Solver.states.input;
                break;
            //Make input based on guess
            case Solver.states.input:
                this.updateInput();                                    
                break;
            //Submit inputted guess
            case Solver.states.submit:
                this.game.submit.onClick();
                this.state = Solver.states.think;
                break;
        }
    }

    /**
     * Interacts with an input button each update cycle for the sake of appearance
     */
    updateInput() {
        if(this.index >= this.game.pegCount) {
            this.state = Solver.states.submit;
            this.index = 0;
        } else {
            this.game.inputs[this.index].index = this.guess[this.index];
            this.game.inputs[this.index].color = MastermindGame.colors[this.guess[this.index]];
            this.index += 1;
        }
    }

    /**
     * For each unfiltered possible guess, compare it against all remaining
     * possible codes and pick out one which filters out the most possibilities
     */
    makeGuess () {
        //Prevent solver being overtaken with second guess request before finishing first
        this.state = Solver.states.sleep;
        
        //Solver gives up, all guesses disposed of
        if(this.remaining.length == 0) {
            return;
        }

        //Default first guess, half color 0 and half color 1
        if(this.game.turn == 0) {
            this.guess = [];
            let pegCount = this.game.pegCount;
            //Set left half to color 0
            for(let i = 0; i < pegCount / 2; i++) {
                this.guess[i] = 0;
            }
            //Set right half to color 1
            for(let i = pegCount / 2; i < pegCount; i++) {
                this.guess[i] = 1;
            }
        }
        //All turns after first
        else {
            //Create guess object to make proper use of compare code function
            let check = new Code("", 0, this.game.pegCount, this.game.colorCount);
            
            //Only the last guess needs to be considered, all others already have been
            let previous = this.game.guesses[this.game.turn - 1];
            
            //Filter the array of possible codes based of what could give the same response key
            this.remaining = this.remaining.filter(code => {
                check.setPegs(code);
                let keys = check.check(previous);
                //True if possible code creates same key when compared to guess as guess did with master code
                return (keys[0] == previous.blacks && keys[1] == previous.whites);
            });
            
            //Guess is first possible remaining code
            this.guess = this.remaining[0];

            //Remove the guess from the possiblity matrix to prevent looping
            this.guesses = this.remaining.slice(1, this.remaining.length);
        }

        //Allow state machine to progress
        this.state = Solver.states.input;
    }
}

/**
 * A decorative object which shoots from the center bottom towards a random
 * spot in the upper half of the canvas
 */
class Firework {
    static states = {done:0, flying:1, boom:2}

    /**
     * Construct a dud firework
     */
    constructor() {
        this.origin = [0, 0];
        this.destination = [0, 0];
        this.travel = 0;
        this.speed = 0;
        this.age = 0;
        this.state = Firework.states.done;
        this.color = MastermindGame.colors[0];
    }
    
    /**
     * Fire off a firework from an origin to a destination
     * @param {Array} origin        [x, y] coordinates of origin
     * @param {Array} destination   [x, y] coordinates of destination
     * @param {Number} speed        Speed of travel
     */
    pew(
        origin = [canvas.width/2, canvas.height],
        destination = [Math.random() * canvas.width/2 + canvas.width/4, Math.random() * canvas.height/2  + canvas.height/4],
        speed = Math.random() * 0.5 + 0.5
    ) {
        this.origin = origin;
        this.destination = destination;
        //Distance to be travelled
        this.travel = Math.sqrt(
            Math.pow(this.origin[0] - this.destination[0], 2) +
            Math.pow(this.origin[1] - this.destination[1], 2)
        );
        this.speed = speed;
        this.age = 0;
        this.state = Firework.states.move;
        this.color = MastermindGame.colors[Math.floor(Math.random() * game.colorCount)];
    }

    /**
     * Find the endpoints of the firework in flight
     * @returns [x, y] coordinates of stat and end points for firework line
     */
    endpoints() {
        let progress = (this.age * this.speed) / this.travel;
        return([[
            this.origin[0] - (this.origin[0] - this.destination[0]) * progress,
            this.origin[1] - (this.origin[1] - this.destination[1]) * progress
        ], [
            this.origin[0] - (this.origin[0] - this.destination[0]) * (progress - 0.05),
            this.origin[1] - (this.origin[1] - this.destination[1]) * (progress - 0.05)
        ]]);
    }

    /**
     * Draw the firewrok
     */
    draw() {
        //Le ded
        if(this.state == Firework.states.done) return;

        context.save();
        context.strokeStyle = this.color;
        context.lineWidth = 2;
        this.age += 1;

        //Firework is in process of exploding
        if(this.state == Firework.states.boom) {
            context.globalAlpha = (251 - this.age) / 250; 
            context.beginPath();
            context.arc(this.destination[0], this.destination[1], this.age * 0.5, 0, 2 * Math.PI);
            context.stroke();
            if(this.age > 250) {
                this.state = Firework.states.done;
                this.age = 0;
            }
        }
        //Firework is moving to destination
        else {
            //Oooh
            if(this.age * this.speed < this.travel) {
                let ends = this.endpoints();
                context.beginPath();
                context.moveTo(ends[0][0], ends[0][1]);
                context.lineTo(ends[1][0], ends[1][1]);
                context.stroke();
            }
            //Aaah
            else {
                this.state = Firework.states.boom;
                this.age = 0;
            }
        }

        context.restore();
    }
}

/**
 * Simple rectangular button which does nothing on click, semi-abstract
 */
class Button {
    constructor(left, top, width, height) {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.hover = false;
        this.hidden = false;
    }

    /**
     * Checks to see if coordinates fall within button
     * @param {Number} x 
     * @param {Number} y 
     */
    checkInside(x, y) {
        if(x < this.left) return false;
        if(x > this.left + this.width) return false;
        if(y < this.top) return false;
        if(y > this.top + this.height) return false;
        return true;
    }

    /**
     * Check if mouse is hovering over button
     * @param {Number} x 
     * @param {Number} y 
     */
    checkHover(x, y) {
        this.hover = this.checkInside(x, y);
    }

    /**
     * Check if button has been clicked
     * @param {Number} x 
     * @param {Number} y 
     */
    checkClick(x, y) {
        if(this.checkInside(x, y)) {
            this.onClick();
        }
    }

    /**
     * Action to take if clicked
     */
    onClick() {

    }

    /**
     * Draw the button
     */
    draw() {

    }
}

/**
 * Button to control a peg color select
 */
class ButtonPeg extends Button {
    constructor(peg, game) {
        super(
            (peg + 1) * 25 + 65,
            (game.turnCount + 2) * 30 + 48,
            10,
            10
        );

        this.index = 0;
        this.color = "blue";
    }

    /**
     * Checks to see if coordinates fall within button
     * @param {Number} x 
     * @param {Number} y 
     */
    checkInside(x, y) {
        if(x < this.left - this.width) return false;
        if(x > this.left + this.width) return false;
        if(y < this.top - this.height) return false;
        if(y > this.top + this.height) return false;
        return true;
    }

    /**
     * Summon the color select tray to the peg button
     */
    onClick() {
        game.tray.summon(this);
    }

    /**
     * Draw the button
     */
    draw() {
        if(this.hidden) return;

        context.save();

        context.beginPath();
        context.arc(this.left, this.top, 10, 0, Math.PI * 2);

        context.fillStyle = this.color;
        context.fill();

        context.strokeStyle = "white";
        if(this.hover) {
            context.lineWidth = 5;
        }
        context.stroke();

        context.restore();
    }
}

class ButtonTray extends Button {
    constructor(game) {
        super(
            0,
            (game.turnCount + 2) * 30 + 20 - game.colorCount * 30,
            40,
            game.colorCount * 30 + 10
        );
        this.colorCount = game.colorCount;
        this.hidden = true;
        this.peg = game.inputs[0];

        this.colorbuttons = [];
        for(let i = 0; i < game.colorCount; i++) {
            this.colorbuttons[i] = new ButtonColor(this, i, game);
        }
    }

    /**
     * Summon the tray to the peg color select button
     * @param {ButtonPeg} peg 
     */
    summon(peg) {
        this.peg = peg;
        this.left = peg.left - 20;
        for(let i = 0; i < game.colorCount; i++) {
            this.colorbuttons[i].left = peg.left + 0;
            this.colorbuttons[i].hidden = false;
        }
        this.hidden = false;
    }

    /**
     * Checks to see if coordinates fall within button
     * @param {Number} x 
     * @param {Number} y 
     */
    checkInside(x, y) {
        if(this.hidden) return false;
        return super.checkInside(x, y);
    }

    /**
     * Check to see if mouse is hovering over tray, and if so check if it is
     * hovering over any buttons within the tray
     * @param {Number} x 
     * @param {Number} y 
     */
    checkHover(x, y) {
        if(this.checkInside(x, y)) {
            for(let i = 0; i < game.colorCount; i++) {
                this.colorbuttons[i].checkHover(x, y);
            }
        }
    }

    /**
     * Overrides parent function to cycle through children
     * @param {Number} x position within canvas
     * @param {Number} y position within canvas
     */
    checkClick(x, y) {
        if(this.checkInside(x, y)) {
            for(let i = 0; i < game.colorCount; i++) {
                this.colorbuttons[i].checkClick(x, y);
            }
        } else {
            this.hide();
        }
    }

    /**
     * Hides the tray and its children
     */
    hide() {
        this.hidden = true;
        for(let i = 0; i < game.colorCount; i++) {
            this.colorbuttons[i].hidden = true;
        }
    }

    /**
     * Draw the tray and its children buttons
     */
    draw() {
        if(this.hidden) return;

        context.save();
        
        context.fillStyle = "#222222";
        context.strokeStyle = "white";

        context.beginPath();
        //context.rect(this.left, this.top, this.width, this.height);
        context.moveTo(this.left, this.top);
        context.lineTo(this.left + this.width, this.top);
        context.arc(
            this.left + this.width/2, this.top + this.height + 20,
            this.width/2,
            0, Math.PI,
            true
        );
        context.closePath();

        context.fill();
        context.stroke();
        
        for(let i = 0; i < game.colorCount; i++) {
            this.colorbuttons[i].draw();
        }
        
        context.restore();
    }
}

/**
 * Button to choose a color from the dropdown tray
 */
class ButtonColor extends Button {
    constructor(tray, index, game) {
        super(
            tray.left + 30,
            tray.top + index * 30 + 20,
            10,
            10
        );

        this.tray = tray;
        this.index = index;
        this.color = MastermindGame.colors[index];
    }

    /**
     * Checks to see if coordinates fall within button
     * @param {Number} x 
     * @param {Number} y 
     */
    checkInside(x, y) {
        if(this.tray.hidden) return false;
        if(x < this.left - this.width) return false;
        if(x > this.left + this.width) return false;
        if(y < this.top - this.height) return false;
        if(y > this.top + this.height) return false;
        return true;
    }

    /**
     * Hide the color select tray and set the peg button to the selected color
     */
    onClick() {
        this.tray.hide();
        this.tray.peg.index = this.index;
        this.tray.peg.color = this.color;
    }

    draw() {
        if(this.hidden) return;

        context.save();

        context.beginPath();
        context.strokeStyle = "white";
        context.fillStyle = this.color;
        context.arc(this.left, this.top, 10, 0, Math.PI * 2);
        context.fill();

        if(this.hover) {
            context.lineWidth = 5;
        }
        context.stroke();

        context.restore();
    }
}

class ButtonSubmit extends Button {
    constructor(game) {
        super(
            canvas.width - 85,  //left
            canvas.height - 35, //top
            80,                 //width
            26                  //height
        );
        this.game = game;

        this.strokeStyle = "white";
        this.backgroundStyle = "gray";
        this.textStyle = "#222222";
        this.font = "bold 18px Arial";
    }

    onClick() {
        let code = [];
        for(let i = 0; i < this.game.pegCount; i++) {
            code[i] = this.game.inputs[i].index;
        }
        this.game.submitCode(code);
    }

    draw() {
        if(this.hidden) return;

        context.save();
        context.beginPath();
        context.rect(this.left, this.top, this.width, this.height);

        if(this.hover) {
            context.fillStyle = this.textStyle;
        } else {
            context.fillStyle = this.backgroundStyle;
        }
        context.strokeStyle = this.strokeStyle;
        context.fill();
        context.stroke();

        
        if(this.hover) {
            context.fillStyle = this.backgroundStyle;
        } else {
            context.fillStyle = this.textStyle;
        }
        context.font = this.font;
        context.fillText("SUBMIT", this.left + 5, this.top + 20);
        context.restore();
    }
}

class ButtonNewGame extends Button {
    constructor(game) {
        super(canvas.width - 74, 1, 73, 48);
        this.game = game;

        this.strokeStyle = "white";
        this.backgroundStyle = "#222222";
        this.textStyle = "gray";
        this.font = "bold 18px Arial";
    }

    onClick() {
        endGame();
    }

    draw() {
        if(this.hidden) return;

        context.save();

        context.beginPath();
        context.rect(this.left, this.top, this.width, this.height);

        if(this.hover) {
            context.fillStyle = this.textStyle;
        } else {
            context.fillStyle = this.backgroundStyle;
        }
        context.strokeStyle = this.strokeStyle;
        context.fill();
        context.stroke();


        if(this.hover) {
            context.fillStyle = this.backgroundStyle;
        } else {
            context.fillStyle = this.textStyle;
        }
        context.font = this.font;
        context.fillText("NEW", this.left + this.width - 57, this.top + 20);
        context.fillText("GAME", this.left + this.width - 63, this.top + 40);

        context.restore();
    }
}

/**
 * Clamps a number to be within an inclusive minimum and maximum value
 * @param {Number} a Constrained value
 * @param {Number} b Minimum
 * @param {Number} c Maximum
 */
function clamp(a,b,c) {
	return Math.max(b,Math.min(c,a));
}