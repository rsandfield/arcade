class Ship extends Body {
	constructor(position, velocity) {
		super(position, velocity, "Ship", 0.0001);
		this.enginePower = 0.000000001;
		this.rcs = 0.000001;
		this.target = null;
	}
	
	boost(time) {
		let thrust = document.getElementById("thrust").value;
		this.velocity = this.velocity.add(new Vector(
			-Math.sin(this.rotation) * thrust,
			Math.cos(this.rotation) * thrust
		).multiply(time * this.enginePower / this.mass));
	}
	
	maneuver(time) {
		this.rotation += time * this.rcs * document.getElementById("rcs").value / this.mass;
	}
	
	move(time) {
		super.move(time);
	}
	
	interact(body, time) {
		super.interact(body, time);
		if((body instanceof Body) && (this.target === null || body.position.subtract(this.position).magnitudeSquared() < this.target.position.subtract(this.position).magnitudeSquared())) {
			this.target = body;
			console.log(this.name + " target changed to " + body.name);
		}
	}
	
	draw() {
		context.save();
		context.translate(
			canvas.width/2,
			canvas.height/2
		);
		
		context.rotate(this.rotation);
		
		context.fillStyle = "blue";
		context.strokeStyle = guiColor;
		
		context.beginPath();
		
		context.moveTo(0, 10);
		context.lineTo(3, -10);
		context.lineTo(-3, -10);
		context.lineTo(0, 10);
		
		context.fill();
		context.stroke();
		
		context.fillStyle = guiColor;
		context.strokeStyle = guiColor;
		
		let velocity = this.target === null ? this.velocity : this.velocity.subtract(this.target.velocity);
		let angle = velocity.angle();
		context.rotate(angle - this.rotation - Math.PI/2);
		context.beginPath()
		
		let halfArc = 0.1
		let magnitude = Math.log10(velocity.magnitude()) + 5;
		magnitude = magnitude < 1 ? 1 : magnitude * 5
		magnitude = 15 + magnitude;
		context.moveTo(0, magnitude);
		context.arc(
			0, 0,
			15,
			Math.PI * (0.5 - halfArc),
			Math.PI * (0.5 + halfArc)
		)
		context.lineTo(0, magnitude);
		
		context.stroke();
		context.rotate(-angle + Math.PI/2);
		
		context.fillText(shortString(velocity.magnitude(),5), Math.cos(angle) * 15, Math.sin(angle) * 15);
		
		if(this.target) {
			let difference = this.position.subtract(this.target.position);
			angle = difference.angle();
			context.rotate(angle + Math.PI/2);
			magnitude = Math.log10(difference.magnitude()) + 3;
		magnitude = magnitude < 1 ? 1 : magnitude * 5
			context.beginPath();
			context.moveTo(0, magnitude);
			context.arc(
				0, 0,
				15,
				Math.PI * (0.5 - halfArc),
				Math.PI * (0.5 + halfArc)
			)
			context.lineTo(0, magnitude);

			context.stroke();
			
			context.rotate(-angle + Math.PI * 1.5);
		
		context.fillText(
			shortString(difference.magnitude(),5),
			-Math.cos(angle) * 15,
			Math.sin(angle) * 15
		);
		}
		
		context.restore();
	}
}