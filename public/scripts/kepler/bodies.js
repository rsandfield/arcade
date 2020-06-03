const stefBoltz = 5.670374419 * Math.pow(10, -8);
const lumWatts = 3.828 * Math.pow(10, 26); //Solar luminosity in watts, actaully ^26

class Material {
	/**
	* @param name
	* @param density
	*/
	constructor(name, density) {
		this.name = name;
		this.density = density;
	}
	
	/**
	 * Creates a new instance of the material which also includes a discreet quantity
	 * @param {Number} mass 
	 */
	mass(mass) {
		let material =  new Material (
			this.name,
			this.density
		);
		material.mass = mass;
		return material;
	}
}

const materials = {
	water: new Material("Water", 1),
	lithic: new Material("Lithic", 3.5),
	metallic: new Material("Metallic", 7.8)
}

class Body {
	constructor(position, velocity, name, mass, primary = null) {
		this.position = position;
		this.velocity = velocity;
		this.name = name;
		this.mass = mass;
		this.soi = this.getSOI();
		this.rotation = 0;
		this.primary = null;
        if(primary) this.changePrimary(primary);
	}
	
	/**
	 * Gets the total mass of the body from its array of mass components
	 */
	getMass() {
		let mass = 0;
		this.makeup.forEach(material => {
			mass += material.mass;
		});
		return mass;
	}

	changePrimary(body) {
		this.primary = body;
		this.soi = this.getSOI();
		this.mu = bigG * this.primary.mass;
	}

	getSOI() {
		let soi = Infinity;
		if(this.primary != null) soi = this.position.subtract(this.primary.position).magnitude() * Math.pow(this.mass / this.primary.mass, 2 / 5);
		console.log("SOI of " + this.name + " = " + scientificNotation(soi));
		return soi;
	}
	
	/**
	 * Applies gravitational forces to the body based on mass and distance of another
	 * @param {Body} body Body to interact with
	 * @param {Number} time Time elapsed since last interaction
	 */
	interact(body, time) {
		let difference = this.position.subtract(body.position);
		
		if(difference.magnitudeSquared() == 0) return;
		
		this.velocity = this.velocity.subtract(difference.normalized().multiply(bigG * time * body.mass/difference.magnitudeSquared()));
		
		if(isNaN(this.velocity.x) || isNaN(this.velocity.y)) {
			this.velocity = new Vector(0, 0);
			console.log("Error in interaction between " + this.name + " and " + body.name);
        }
		
		let distance = this.position.subtract(body.position).magnitude();
        if(
			(body instanceof Body) && (						//Is body
				body.mass > this.mass && (					//More massive than this
					this.primary === null || (				//No primary to compare
						this.primary.soi < this.position.subtract(this.primary.position).magnitude() &&	//Outside of old soi
						body.soi > distance					//Within new soi
					) || (					
						body.soi > distance &&				//Within sphere of influence
						body.soi < this.primary.soi			//Tighter sphere of influence then current
					)
				)
			)
		) {
			console.log(this.name + " primary changed to " + body.name);
			this.changePrimary(body);
		}
	}
	
	move(time) {
		this.position = this.position.add(this.velocity.multiply(time));
		if(isNaN(this.position.x) || isNaN(this.position.y)) {
			this.position = new Vector(0,0);
			console.log("Velocity error at " + this.name);
		}
	}

	calculateOrbit() {
		let relativePosition = this.position.subtract(this.primary.position);
		let relativeVelocity = this.velocity.subtract(this.primary.velocity);
		let radius = relativePosition.magnitude();

		let angularMomentum = relativePosition.crossProduct(relativeVelocity);
		let eccentricity = relativePosition.multiply(relativeVelocity.magnitudeSquared() / this.mu - 
			1/relativePosition.magnitude()).subtract(relativeVelocity.multiply(relativePosition.dotProduct(relativeVelocity)/this.mu));
		this.semimajor = Math.pow(angularMomentum, 2) / ((1 - eccentricity.magnitudeSquared()) * this.mu);
		this.period = Math.pow(this.semimajor, 1.5) * 1000;
		let transverse = relativeVelocity.multiply(radius * Math.sin(relativeVelocity.angle() - relativePosition.angle()));
		this.eccentricity = eccentricity.magnitude();
		let numerator = this.semimajor * (1 - Math.pow(this.eccentricity, 2));
		this.perihelion = eccentricity.angle();
		this.trueAnomaly = eccentricity.y / eccentricity.x;
		this.distance = Math.sqrt(1 - eccentricity.magnitudeSquared()) * Math.sin(this.angle) / (this.eccentricity + Math.cos(this.angle));

		document.getElementById("bodyname").value = this.name;
		document.getElementById("semimajor").value = shortString(this.semimajor, 5);
		document.getElementById("eccentricity").value = shortString(this.eccentricity, 5);
		document.getElementById("perihelion").value = shortString(this.perihelion, 5);
		document.getElementById("trueanomaly").value = shortString(this.trueAnomaly, 5);
	}
    
    draw () {
        context.save();
		context.translate(
			this.position.x * scale + transform.x,
			this.position.y * scale + transform.y
        );
        context.strokeStyle = guiColor;
        context.fillStyle = guiColor;

        let radius = 10;
        if(this.radius * 1.1 * scale > 10) {
            radius = this.radius * 1.1 * scale;

            if(this.primary) {
                arrowToTarget(
                    this.position,
                    this.primary.position,
                    radius,
                    radius / 10,
                    0.2
				);
				
				arrowToTarget(
					this.position,
					this.velocity.subtract(this.primary.velocity),
					radius,
					radius / 10,
					0.2
				);

                let angle = this.position.subtract(this.primary.position).angle();
				context.rotate(angle - Math.PI/2);
				let distance = shortString(this.position.subtract(this.primary.position).magnitude() / 23454.8, 5) + " AU";
                context.fillText(this.primary.name, -context.measureText(this.primary.name).width/2, -radius * 1.2 - 10);
                context.fillText(distance, -context.measureText(distance).width/2, -radius * 1.2);
                context.rotate(-angle + Math.PI/2);
            }
        } else {
            context.beginPath();
            context.arc(0,0,10,0,Math.PI*2);
            context.stroke();

            if(this.primary) {
                let angle = this.position.subtract(this.primary.position).angle();
                context.rotate(angle);

                context.beginPath();
                context.moveTo(-10, 0);
                context.lineTo(10, 3);
                context.lineTo(10, -3);
                context.lineTo(-10, 0);
                context.stroke();

                context.rotate(-Math.PI/2);
				let distance = shortString(this.position.subtract(this.primary.position).magnitude() / 23454.8, 5) + " AU";
                context.fillText(this.primary.name, -context.measureText(this.primary.name).width/2, -radius * 1.2 - 10);
                context.fillText(distance, -context.measureText(distance).width/2, -radius * 1.2);
                context.rotate(-angle + Math.PI/2);
            }
		}
		
		if(this.primary) {
			context.fillStyle = guiColor + "08";
			context.beginPath();
			context.arc(0, 0, this.soi * scale, 0, Math.PI * 2);
			context.fill();

			this.calculateOrbit();
			let relativePosition = this.position.subtract(this.primary.position);
			let semiminor = Math.pow(this.semimajor, 2) * (1 - Math.pow(this.eccentricity, 2));
			let linearEcc = Math.sqrt(Math.pow(this.semimajor, 2) - semiminor);
			semiminor = Math.sqrt(semiminor);

			context.strokeStyle = guiColor + "78";

			context.beginPath();
			context.ellipse(
				-(relativePosition.x + Math.cos(this.perihelion) * linearEcc) * scale,
				-(relativePosition.y + Math.sin(this.perihelion) * linearEcc) * scale,
				this.semimajor * scale,
				semiminor * scale,
				this.perihelion,
				0, 2 * Math.PI
			)
			context.stroke();
		}

        context.fillText(this.name, -context.measureText(this.name).width/2, -radius * 1.3);

        context.restore();
    }
}

class Star extends Body {
    constructor(position, velocity, name, makeup) {
        super(position, velocity, name, 0);
		this.makeup = makeup;
		this.mass = this.getMass();
        this.luminosity = 1;
        this.temperature = 5778;
		this.radius = this.getRadius();
        this.density = this.getDensity();
		this.color = this.getColor();
    }

    getRadius() {
        return 109 * Math.pow(this.temperature / 5778, 2) * Math.pow(this.luminosity, 0.5);
    }

    getDensity() {
        return this.mass / (4/3 * Math.PI * Math.pow(this.radius, 3));
    }

    getColor() {
        return "yellow";
    }

    getTemperatureAtRadius(au, albedo) {
        return Math.pow(this.luminosity * (1-albedo) / (16 * Math.PI * stefBoltz * Math.pow(au, 2)), .25);
    }
  
    getRadiusOfTemperature(temp) {
        return Math.pow(this.luminosity / (16 * stefBoltz * Math.pow(temp, 4)), 0.5);
    }

    draw() {
        context.save();
		context.translate(
			this.position.x * scale + transform.x,
			this.position.y * scale + transform.y
        );
        context.fillStyle = guiColor;

		context.fillText("Luminosity: " + this.luminosity, 20, -20)
        context.fillText("1AU: " + scientificNotation(this.getTemperatureAtRadius(1, .3), 5), 20, 0);
        context.fillText("5.2AU: " + scientificNotation(this.getTemperatureAtRadius(5.2, .52), 5), 20, 20);

        context.fillText("273: " + shortString(this.getRadiusOfTemperature(273), 5), -60, 0);
        context.fillText("373: " + shortString(this.getRadiusOfTemperature(373), 5), -60, 20);

        context.restore();

        super.draw();
    }
}

class Planet extends Body {
	constructor(position, velocity, name, makeup) {
		super(position, velocity, name, 0);
		this.makeup = makeup;
		this.mass = this.getMass();
		this.density = this.getDensity();
		this.radius = this.getRadius();
		this.color = this.getColor();
	}
	
	getDensity() {
		let uncompressed = 0;
		this.makeup.forEach(material => {
			uncompressed += material.mass / (this.mass * material.density);
		})
		uncompressed = 1 / uncompressed;
		
		if(uncompressed < 3.5) {
			this.type = "water-rock";
			let fraction = (this.makeup.find(material => material.name = "Water")).mass / this.mass;
			return 1.4 / (fraction + 0.4);
		} else {
			this.type = "rock-metal";
			let fraction = (this.makeup.find(material => material.name == "Lithic")).mass / this.mass;
			return 6.349 / (fraction + 0.814);
		}
	}
	
	getRadius() {
		let fw = (this.makeup.find(material => material.name == "Water")).mass / this.mass;
		let fr = (this.makeup.find(material => material.name == "Lithic")).mass / this.mass;
		let fm = (this.makeup.find(material => material.name == "Metallic")).mass / this.mass;
		let lm = Math.log10(this.mass);
		if(this.type == "water-rock") {
			return (
				(0.0912*fw+0.1603)*lm*lm +
				(0.3330*fw+0.7387)*lm +
				(0.4639*fw+1.1193)
			);
		}
		if(this.type == "rock-metal") {
			return (
				(0.0592*fr+0.0975)*lm*lm +
				(0.2337*fr+0.4938)*lm +
				(0.4639*fr+0.7932)
			);
		}
	}
	
	getColor() {
		let fw = (this.makeup.find(material => material.name == "Water")).mass / this.mass;
		let fr = (this.makeup.find(material => material.name == "Lithic")).mass / this.mass;
		let fm = (this.makeup.find(material => material.name == "Metallic")).mass / this.mass;
		return rgb(fm, fr, fw);
	}
	
	draw() {
		context.save();
		context.translate(
			this.position.x * scale + transform.x,
			this.position.y * scale + transform.y
		);
		
		context.fillStyle = this.color;
		
		context.beginPath();
		context.arc(
			0, 0,
			this.radius * scale,
			0, Math.PI * 2
		);
		context.stroke();
		context.fill();
		
		context.fillStyle = guiColor;
		context.fillText(shortString(this.radius,5), 10, -10);
		context.fillText(shortString(this.mass,5), 10, 10);
		
        context.restore();
		
		if(this.primary && this.position.subtract(this.primary.position).magnitudeSquared()*scale > 2400) super.draw();
	}
}