const canvas = document.getElementById("display");
const context = canvas.getContext("2d");
var transform = {
	x:canvas.width/2,
	y:canvas.height/2
};
var scale = 4; //0.005;
var speed = 100;
const bigG = 6.673 * Math.pow(10, -11);
const guiColor = "#00FF00"

var bodies = [
	new Ship(
		new Vector(6, 23454.8),
		new Vector(Math.sqrt(bigG * 333000 / 23454.8, 0.5), Math.pow(bigG / 6, 0.5)),
	),
	new Star(
		new Vector(0, 0),
		new Vector(0, 0),
		"Sun",
		[
			materials.water.mass(329000),
			materials.lithic.mass(0),
			materials.metallic.mass(4000)
		]
	),
	new Planet(
		new Vector(0, 9077),
		new Vector(Math.sqrt(bigG * 333000 / 9077, 0.5), 0),
		"Mercury",
		[
			materials.water.mass(0.000),
			materials.lithic.mass(0.01825),
			materials.metallic.mass(0.03705)
		]
	),
	new Planet(
		new Vector(0, 16957.8),
		new Vector(Math.sqrt(bigG * 333000 / 16957.8, 0.5), 0),
		"Venus",
		[
			materials.water.mass(0.0003),
			materials.lithic.mass(0.554),
			materials.metallic.mass(0.261)
		]
	),,
	new Planet(
		new Vector(0, 23454.8),
		new Vector(Math.sqrt(bigG * 333000 / 23454.8, 0.5), -0.01 * Math.pow(bigG / 60, 0.5)),
		"Earth",
		[
			materials.water.mass(0.0003),
			materials.lithic.mass(0.68),
			materials.metallic.mass(0.32)
		]
	),
	new Planet(
		new Vector(60, 23454.8),
		new Vector(Math.sqrt(bigG * 333000 / 23454.8, 0.5), Math.pow(bigG / 58, 0.5)),
		"Moon",
		[
			materials.water.mass(0.0003),
			materials.lithic.mass(0.0067),
			materials.metallic.mass(0.003)
		]
	)
]

var tensors = new TensorGrid(1000000, 50, bodies);
tensors.setFocus(bodies[0]);

var last = Date.now();
var time = 0;
var starDate = new Date(2000, 5, 5);
animateFrame();
function animateFrame() {
	context.clearRect(0,0,canvas.width,canvas.height);

	speed = document.getElementById("speed").value;
	
	let now = Date.now();
	time = (now - last) * speed;
	last = now;
	starDate = new Date(starDate.getTime() + time * 6)
	document.getElementById("date").value = starDate.toString().substring(4, 24);
	
	tensors.clearCells();
	tensors.bodies.forEach(body => {
		tensors.assign(body);
	});
	tensors.grid.forEach(cell => {
		let bodies = tensors.getBodies(cell.index);
		cell.bodies.forEach(body => {
			bodies.forEach(other => {
				if(!(body === other)) body.interact(other, time);
			});
		});
	});
	tensors.bodies.forEach(body => {
		body.move(time);
	});
	bodies[6].calculateOrbit(bodies[5], bodies[1]);

	tensors.draw();
	
	requestAnimationFrame(animateFrame);
}

document.addEventListener('keydown', keyDown);
document.addEventListener('wheel', zoom);

function keyDown(e) {
	let ship = bodies[0];
  if(e.code == "KeyW" || e.code == "ArrowUp") {
		ship.boost(time);
	}
	if(e.code == "KeyA" || e.code == "ArrowLeft") {
		ship.maneuver(-time);
	}
	if(e.code == "KeyD" || e.code == "ArrowRight") {
		ship.maneuver(time);
	}
}

function zoom(e) {
	let zoomScaling = Math.log10(scale);
	scale = clamp(scale * (1 - e.deltaY * 0.001), 0.005, 1000);
}