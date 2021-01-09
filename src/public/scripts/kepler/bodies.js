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
	/**
	 * 
	 * @param {string} name Name of body
	 * @param {Number} mass Mass of body in yottatons
	 * @param {Body} primary Body body orbits
	 * @param {Number} semimajor Average radius of orbit around primary in gigameters
	 * @param {Number} eccentricity [0-1) for elliptical orbits, ≥1 for parobolic orbits
	 * @param {Number} periapsisArgument Angluar displacement of periapsis in radians
	 * @param {Number} meanAnomaly Position of planet along orbit, normalized to circular reference in radians
	 * @param {Number} inclination Angular displacement of orbit relative to reference plane in radians
	 * @param {Number} ascending Angular displacement of ascening node relative to arguement of periapsis in radians
	 */
	constructor(name, mass, primary, semimajor = 0, eccentricity = 0, periapsisArgument = 0, meanAnomaly = 0, inclination = 0, ascending = 0) {
		this.name = name;
		this.mass = mass;
		this.primary = primary;
		this.soi = Infinity;
		this.rotation = 0;
		this.position = new Vector(0, 0);

		if(primary) {
			this.period = 0;
			this.soi = Infinity;
			this.eccentricity = eccentricity;
			this.semiMajor = semimajor; //Gigameters
			this.changePrimary(primary);
			this.semiMinor = Math.sqrt(Math.pow(this.semiMajor, 2) * (1 - Math.pow(this.eccentricity, 2)));
			this.linearEcc = Math.sqrt(Math.pow(this.semiMajor, 2) - Math.pow(this.semiMinor, 2));
			this.periapsis = this.semiMajor - this.linearEcc;
			this.apoapsis = this.semiMinor + this.linearEcc;
			this.periapsisArgument = periapsisArgument;
			this.meanAnomaly = meanAnomaly;
			this.inclination = inclination;
			this.ascending = ascending;
		}
	}

	update(time) {
		if(!this.primary) return;
		this.meanAnomaly += 2 * Math.PI * (time / this.period);
		let test = this.meanAnomaly;
		this.meanAnomaly = this.meanAnomaly % (2 * Math.PI);
		if(test > this.meanAnomaly) console.log(this.name + ": " + starDate);
		this.trueAnomaly = this.getTrueAnomaly();
		this.position = new Vector(
			Math.cos(this.trueAnomaly) * this.semiMajor - this.linearEcc,
			Math.sin(this.trueAnomaly) * this.semiMinor
		);
	}

	changePrimary(body) {
		this.primary = body;
		this.soi = this.semiMajor * Math.pow(this.mass / this.primary.mass, 2 / 5);
		this.mu = bigG * this.primary.mass;
		this.period = 2 * Math.PI * Math.sqrt(Math.pow(this.semiMajor, 3)/this.mu);
		console.log(this.name + " under the influence of " + this.primary.name +
			" has an SOI of " + scientificNotation(this.soi) + "Gm" +
			" and a period of " + decimalPlace(this.period / (3600 * 24 * 365), 1) + "yr"
		);
	}

	getTrueAnomaly(meanAnomaly = this.meanAnomaly) {
		return (
			meanAnomaly +
			2 * this.eccentricity * Math.sin(meanAnomaly) +
			1.25 * Math.pow(this.eccentricity, 2) * Math.sin(2 * meanAnomaly)
		);
	}
	
	getMass() {
		return this.mass;
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
    
    drawOrbitalPath() {
        context.save();
		context.translate(
			-this.position.x * scale,
			-this.position.y * scale
		);
		context.rotate(-this.periapsisArgument);

		context.strokeStyle = guiColor + "40";
        context.fillStyle = guiColor;

		context.rotate(this.periapsisArgument);
		context.beginPath();
		context.ellipse(
			-this.linearEcc * scale,
			0,
			this.semiMajor * scale,
			this.semiMinor * scale,
			0,
			0, 2 * Math.PI
		);
		context.stroke();
		context.restore();
	}
	
	drawOrbit() {
		context.save();

		if(this.primary) {
			context.translate(
				(this.position.x + this.primary.position.x) * scale + transform.x,
				(this.position.y + this.primary.position.y) * scale + transform.y
			);
			this.drawOrbitalPath();
		} else {
			context.translate(
				this.position.x * scale + transform.x,
				this.position.y * scale + transform.y
			);
		}
		
		context.strokeStyle = guiColor;
		context.fillStyle = guiColor;

		let radius = 10;
		if(this.radius * scale > 10) radius = this.radius * scale;

		context.beginPath();
		context.arc(
			0, 0,
			radius,
			0, Math.PI * 2
		);
		context.stroke();

		context.fillText(this.name, radius, -12);
		context.fillText("m:" + scientificNotation(this.mass * 1000, 3) + "ET", radius, 0);
		context.fillText("r:  " + scientificNotation(this.radius * 1000, 1) + "Mm", radius, 12);
		if(this.primary) context.fillText("a:  " + scientificNotation(this.semiMajor * 1000, 1) + "Mm", radius, 24);

		/*
		let radius = this.radius * 1000;
		if(this.primary) {

			if(this.radius * 1.1 * scale > 10) {
				radius = this.radius * 1.1 * scale;
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
			} else {
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
			
			context.fillStyle = guiColor + "08";
			context.beginPath();
			context.arc(0, 0, this.soi * scale, 0, Math.PI * 2);
			context.fill();



			context.fillText(this.name, -context.measureText(this.name).width/2, -radius * 1.3);
		}

		context.translate(
			this.position.x * scale + transform.x,
			this.position.y * scale + transform.y
        );
		*/
        context.restore();
	}
}

class Star extends Body {
    constructor(name, mass, primary, semiMajor) {
        super(name, mass, primary, semiMajor);
        this.luminosity = 1;
        this.temperature = 5778;
		this.radius = this.getRadius();
        this.density = this.getDensity();
		this.color = this.getColor();
    }

    getRadius() {
        return 0.6957 * Math.pow(this.temperature / 5778, 2) * Math.pow(this.luminosity, 0.5);
    }

    getDensity() {
        return this.mass / (4/3 * Math.PI * Math.pow(this.radius, 3));
    }

    getColor() {
        return "yellow";
	}
	
	getIrradianceAtDistance(gigaMeters) {
		return(this.luminosity / (4 * Math.PI * gigaMeters * gigaMeters))
	}

	/**
	 * 
	 * @param {Number} au Distance from star
	 * @param {Number} albedo Bonds albedo of planet
	 */
    getTemperatureAtRadius(au, albedo) {
		return this.temperature * Math.sqrt(696/(au*2000)) * Math.pow(1-albedo, 0.25);//696 is solar radius in mega meters, 2000 is due to au being giga meters and also *2
    }
  
    getRadiusOfTemperature(temp) {
        return Math.pow(this.luminosity / (16 * stefBoltz * Math.pow(temp, 4)), 0.5);
    }

    drawOrbit() {
        super.drawOrbit();
		/*
        context.save();
		context.translate(
			this.position.x * scale + transform.x,
			this.position.y * scale + transform.y
        );
		context.strokeStyle = guiColor;
		context.fillStyle = guiColor;
		
		context.fillText("Luminosity: " + this.luminosity, 20, -20)
        context.fillText("0.4AU: " + shortString(this.getTemperatureAtRadius(0.4, 0.12), 5) + "(437)", 20, -10);
        context.fillText("0.7AU: " + shortString(this.getTemperatureAtRadius(0.7, 0.75), 5) + "(232)", 20, 0);
        context.fillText("1.0AU: " + shortString(this.getTemperatureAtRadius(1, 0.306), 5) + "(255)", 20, 10);
        context.fillText("1.5AU: " + shortString(this.getTemperatureAtRadius(1.5, 0.16), 5) + "(209)", 20, 20);
        context.fillText("5.2AU: " + shortString(this.getTemperatureAtRadius(5.2, .34), 5), 20, 30);
        context.fillText("9.6AU: " + shortString(this.getTemperatureAtRadius(9.6, .34), 5), 20, 40);
        context.fillText("19.2AU: " + shortString(this.getTemperatureAtRadius(19.2, .30), 5), 20, 50);
        context.fillText("30AU: " + shortString(this.getTemperatureAtRadius(30, .29), 5), 20, 60);

        context.fillText("273: " + shortString(this.getRadiusOfTemperature(273), 5), -60, 0);
        context.fillText("373: " + shortString(this.getRadiusOfTemperature(373), 5), -60, 20);
        context.restore();
		*/
    }
}

class Planet extends Body {
	constructor(name, mass, primary, semimajor = 0, eccentricity = 0, periapsisArgument = 0, meanAnomaly = 0, inclination = 0, ascending = 0) {
		super(name, mass, primary, semimajor, eccentricity, periapsisArgument, meanAnomaly, inclination, ascending);
		/*
		this.makeup = makeup;
		this.mass = this.getMass();
		this.density = this.getDensity();
		this.radius = this.getRadius();
		this.color = this.getColor();
		*/

		this.radius = 0.006371
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
	
	drawOrbit() {
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
		
        context.restore();
		
		if(this.semiMajor*scale > 30) super.drawOrbit();
	}
}