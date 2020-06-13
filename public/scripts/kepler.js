const canvas = document.getElementById("display");
const context = canvas.getContext("2d");
var transform = {
	x:canvas.width/2,
	y:canvas.height/2
};
var scale = 1.25; //0.005;
var speed = 100;
var mode = "Orbit"
const bigG = 6.673 * Math.pow(10, -11);
const guiColor = "#00FF00"

var bodies = [];
var parser = new DOMParser();
var xmlHTTP = new XMLHttpRequest();
xmlHTTP.addEventListener("load", response => {
	let system = parser.parseFromString(xmlHTTP.responseText, "text/xml").childNodes[0].childNodes;
	system.forEach(subsystem => {
		traverseSystem(subsystem);
	})
});
xmlHTTP.open("GET", "./public/scripts/kepler/bodies.xml", true);
xmlHTTP.send();

function traverseSystem(system, primary = null) {
	let bodyType = system.tagName;
	if(bodyType == "star") {
		console.log("Star: " + system.getElementsByTagName("name")[0].childNodes[0].nodeValue);
		let star;
		if(primary) {
			star = new Star(
				system.getElementsByTagName("name")[0].childNodes[0].nodeValue,
				Number.parseFloat(system.getElementsByTagName("mass")[0].childNodes[0].nodeValue),
				primary,
				Number.parseFloat(system.getElementsByTagName("semiMajor")[0].childNodes[0].nodeValue),
				Number.parseFloat(system.getElementsByTagName("eccentricity")[0].childNodes[0].nodeValue),
				Number.parseFloat(system.getElementsByTagName("periapsisArgument")[0].childNodes[0].nodeValue),
				Number.parseFloat(system.getElementsByTagName("meanAnomaly")[0].childNodes[0].nodeValue),
				Number.parseFloat(system.getElementsByTagName("inclination")[0].childNodes[0].nodeValue),
				Number.parseFloat(system.getElementsByTagName("ascendingNode")[0].childNodes[0].nodeValue)
			);
		} else {
			star = new Star(
				system.getElementsByTagName("name")[0].childNodes[0].nodeValue,
				system.getElementsByTagName("mass")[0].childNodes[0].nodeValue
			);
		}
		bodies.push(star);
		system.childNodes.forEach(subsystem => {
			traverseSystem(subsystem, star);
		})
	}
	if(bodyType == "planet") {
		console.log("Planet: " + system.getElementsByTagName("name")[0].childNodes[0].nodeValue);
		let planet = new Planet(
			system.getElementsByTagName("name")[0].childNodes[0].nodeValue,
			Number.parseFloat(system.getElementsByTagName("mass")[0].childNodes[0].nodeValue),
			primary,
			Number.parseFloat(system.getElementsByTagName("semiMajor")[0].childNodes[0].nodeValue),
			Number.parseFloat(system.getElementsByTagName("eccentricity")[0].childNodes[0].nodeValue),
			Number.parseFloat(system.getElementsByTagName("periapsisArgument")[0].childNodes[0].nodeValue),
			Number.parseFloat(system.getElementsByTagName("meanAnomaly")[0].childNodes[0].nodeValue),
			Number.parseFloat(system.getElementsByTagName("inclination")[0].childNodes[0].nodeValue),
			Number.parseFloat(system.getElementsByTagName("ascendingNode")[0].childNodes[0].nodeValue)
		);
		bodies.push(planet);
	}


	//let bodies = system.querySelectorAll('star,planet');
}

var last = Date.now();
var time = 0;
var starDate = new Date(2020, 0, 0);
let target = new Body("Nope", 0);
animateFrame();
function animateFrame() {
	context.clearRect(0,0,canvas.width,canvas.height);

	speed = document.getElementById("speed").value;
	document.getElementById("zoom").value = shortString(scale,5);
	
	let now = Date.now();
	time = (now - last) * speed;
	last = now;
	starDate = new Date(starDate.getTime() + time * 1004.81);
	document.getElementById("date").value = starDate.toString().substring(4, 24);
	
	bodies.forEach(body => {
		body.update(time);
	});

	transform = target.position.multiply(-scale).add(new Vector(canvas.width/2, canvas.height/2));

	bodies.forEach(body => {
		body.drawOrbit();
	});
	
	requestAnimationFrame(animateFrame);
}

function switchMode(name) {
	mode = name;
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