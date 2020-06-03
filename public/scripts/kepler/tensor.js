

class TensorCell {
	constructor(index, position, length, settings = {}) {
		this.index = index;
		this.position = position;
		this.length = length;
		this.name = "Cell" + index;
		this.mass = 0;
		this.bodies = [];
		this.color = rgb(Math.random(), Math.random(), Math.random());

		settings.displayGridValues = settings.displayGridValues || false;
		this.settings = settings;
	}
	
	draw() {
		context.save();
		context.translate(
			this.position.x * scale + transform.x,
			this.position.y * scale + transform.y
		);
		
		context.strokeStyle = guiColor + "20";
		context.fillStyle = this.color;
		
		context.beginPath();
		context.rect(
			(this.position.x - this.length/2) * scale,
			(this.position.y - this.length/2) * scale,
			this.length * scale,
			this.length * scale
		);
		context.stroke();
		
		if(this.settings.displayGridValues == true) {
			context.fillText(
				shortString(this.position.x,0),
				this.position.x - this.length/2,
				this.position.y - this.length/2 + 10
			);
			context.fillText(
				shortString(this.position.y,5),
				this.position.x - this.length/2,
				this.position.y - this.length/2 + 20
			);
			
			context.fillText(
				this.index.toString(),
				this.position.x - this.length/2,
				this.position.y + this.length/2 - 5
			);
		}
		
		context.restore();
	}
}

class TensorGrid {
	constructor(size, count, bodies) {
		this.size = size;
		this.count = count;
		this.grid = [];
		this.bodies = bodies;
		
		let length = size / count;
		
		for(let i = 0; i < count; i++) {
			for(let j = 0; j < count; j++) {
				this.grid[j * count + i] = new TensorCell(
					j * count + i,
					new Vector(
						(i + 0.5 - count/2) * length / 2,
						(j + 0.5 - count/2) * length / 2),
					length
				);
			}
		}
	}

	setFocus(body) {
		this.focus = body;
	}
	
	clearCells() {
		this.grid.forEach(cell => {
			cell.mass = 0;
			cell.bodies = [];
		})
	}
	
	findIndex(position) {
		let halfLength = this.size / (this.count * 2);
		let x = Math.round((((position.x - halfLength) / this.size) + 0.5) * this.count);
		let y = Math.round((((position.y - halfLength) / this.size) + 0.5) * this.count);
		return y * this.count + x;
	}
	
	assign(body) {
		let index = this.findIndex(body.position);
		if(isNaN(index) || index >= this.grid.length || index < 0) {
			console.log(body.name + " is out of bounds.");
			this.bodies.splice(this.bodies.indexOf(body));
			return;
		}
		
		this.grid[index].mass += body.mass;
		this.grid[index].bodies.push(body);
	}
	
	getBodies(index) {
		let bodies = [];
		let iX = index % this.count;
		let iY = ((index - iX) / this.count) % this.count;
		for(let y = 0; y < this.count; y++){
			for(let x = 0; x < this.count; x++){
				let index = y * this.count + x;
				if(
					x >= iX - 2 && x <= iX + 2 &&
					y >= iY - 2 && y <= iY + 2
				) {
					this.grid[index].bodies.forEach(body => {
						bodies.push(body);
					});
				} else {
				if(this.grid[index].mass > 0)
					bodies.push(this.grid[index]);
				}
			}
		}
		return bodies;
	}
	
	draw() {
		document.getElementById("zoom").value = shortString(scale,5);
		transform = this.focus.position.multiply(-scale).add(
			new Vector(canvas.width/2, canvas.height/2)
		);
		
		this.grid.forEach(cell => {
			cell.draw();
		})
		
		this.bodies.forEach(body => {
			body.draw();
		})
	}
}