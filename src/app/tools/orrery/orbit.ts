import { Camera, Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TubeBuilder, Vector3 } from "@babylonjs/core";
import { Container, TextBlock, Rectangle } from "@babylonjs/gui";
import { clampLooping, scientificNotation } from "src/app/utility/utilities";
import { AstralConstants, Astrophysics } from "./astrophysics";
import { Body } from "./body";

export class Orbit {
    eccentricity = 0;
    linearEccentricity = 0;
    semimajor = 149.6;
    semiminor = 0;
    inclination = 0;
    ascendingNode = 0;
    periapsis = 0;
    meanAnomaly = 0;
    mu = 1;
    period = 0;
    recent: Array<[number, Vector3]> = new Array<[number, Vector3]>(5);
    scale = 1;

    mesh: Mesh;
    material: StandardMaterial;

    //statBlock: Container;
    //stats: TextBlock[];

    constructor(
        public name: string,
        public primary: Body,
        public scene: Scene,
        {
            eccentricity = 0, semimajor = 149.6,
            inclination = 0, ascendingNode = 0,
            periapsis = 0, meanAnomaly = 0
        },
        public settings = {}
    ) {
        this.eccentricity = eccentricity;
        this.semimajor = semimajor;
        this.semiminor = this.semimajor * Math.sqrt(1 - Math.pow(this.eccentricity, 2));
        this.linearEccentricity = Math.sqrt(Math.pow(this.semimajor, 2) - Math.pow(this.semiminor, 2));
        
        this.inclination = inclination;
        this.ascendingNode = ascendingNode;
        this.periapsis = periapsis;
        this.meanAnomaly = meanAnomaly;

        this.mu = this.primary.mass * AstralConstants.G;
        this.period = Math.sqrt(this.semimajor ** 3 / this.mu) * AstralConstants.PI_2 * 1000;

        let path = [];
        let div = Math.floor(Math.sqrt(this.period) / 20);
        for(let i = 0; i <= div; i++) {
            path.push(this.positionRelativeToPrimaryAt(this.period * i / div));
        }
        let radius = (Math.log(this.semimajor) / Math.log(200)) ** 12;
        this.mesh = MeshBuilder.CreateTube(name + "Orbit", {
            path: path,
            radius,
            tessellation: 4,
            sideOrientation: Mesh.BACKSIDE
        }, scene);
        this.material = new StandardMaterial(name + "OrbitMat", scene);
        this.material.emissiveColor = new Color3(0, 1, 0);
        this.material.alpha = 0.5;
        this.material.disableLighting = true;
        this.mesh.material = this.material;
    }

    destructor() {

    }

    /*
    createStatBlock() {
        let fontSize = 14;
        let padding = 2;

        let container = new Rectangle();
        container.clipContent = false;
        container.linkOffsetX = 20;
        container.thickness = 0;

        this.engineService.getAdvancedTexture().addControl(container);
        container.linkWithMesh(this.mesh);

        for(let i = 0; i < 8; i++) {
            this.stats.push(this.createStatText(container, i * (fontSize + padding)));
        }
        container.height = this.stats.length * fontSize;
        container.adaptWidthToChildren = true;

        this.stats[0].text = "M: " + scientificNotation(this.mass, 4) + " kg";
        this.stats[1].text = "R: " + scientificNotation(this.radius, 4) + " m";
        if(this.orbit) {
            this.stats[2].text = "SMA: " + scientificNotation(this.orbit.semimajor, 4) + " m";
            this.stats[3].text = "E: " + scientificNotation(this.orbit.eccentricity, 4);
        }

        let width = container.width;
        width = typeof width == "string" ? Number.parseInt(width) : width
        container.linkOffsetX = width / 2 + 10 + padding;

        return container;
    }
    */
    changeScale(scale: number) {
        this.scale = scale;
        this.mesh.scaling = new Vector3(scale, scale, scale);
    }

    getRecentRelativePosition(epoch: number): Vector3 | null {
        for(let i = 0; i < this.recent.length; i++) {
            if(this.recent[i] && this.recent[i][0] == epoch) return this.recent[i][1];
        }
        return null;
    }

    pushRecentRelativePosition(epoch: number, position: Vector3) {
        for(let i = 0; i < this.recent.length - 1; i++) {
            this.recent[i + 1]  = this.recent[i];
        }
        this.recent[0] = [epoch, position];
    }

    positionRelativeToPrimaryAt(epoch: number): Vector3 {
        let position = this.getRecentRelativePosition(epoch);
        if(position) return position;
        // Get the epoch's mean anomaly from the initial mean and time since intialization
        let meanAnomaly = clampLooping(
            this.meanAnomaly + (epoch % this.period) / this.period * 2 * Math.PI,
            0, AstralConstants.PI_2
        );
        
        // Use Newton's approxmiation to recursively converge on eccentric anomaly
        let eccentricAnomaly = Astrophysics.approximateEccentricAnomaly(meanAnomaly, this.eccentricity);

        // Find x and y positions on 2d plane of orbit from eccentric anomaly and axial lengths
        position = new Vector3(
            Math.cos(eccentricAnomaly) * this.semimajor - this.linearEccentricity,
            0,
            Math.sin(eccentricAnomaly) * this.semiminor
        )

        this.pushRecentRelativePosition(epoch, position);
        return position
    }

    positionAt(epoch: number): Vector3 {
        if(this.period <= 0) return this.primary.positionAt(epoch);
        let position = this.positionRelativeToPrimaryAt(epoch);
        position = position.scale(this.scale);
        position = position.add(this.primary.positionAt(epoch));
        return position;
    }

    update(epoch: number, camera: Camera): void {
        this.reposition(epoch);
    }

    reposition(epoch: number): void {
        this.mesh.position = this.primary.positionAt(epoch);
    }
}