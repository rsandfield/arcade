import { Camera, Color3, Light, Material, Mesh, MeshBuilder, NoiseProceduralTexture, PointLight, Quaternion, Scene, StandardMaterial, Vector3 } from "@babylonjs/core";
import { Button, Ellipse, Rectangle, TextBlock } from "@babylonjs/gui";
import { EngineService } from "src/app/utility/engine.service";
import { scientificNotation } from "src/app/utility/utilities";
import { AstralConstants, Astrophysics, PlanetaryPhysics } from "./astrophysics";
import { Orbit } from "./orbit";
import { createStatText } from "./utilities";

export class Body {
    mesh: Mesh;
    material: StandardMaterial;
    
    button: Button;
    statBlock: Rectangle;
    stats: TextBlock[];
    
    satellites = new Array<Body>();
    mass = 1;
    composition = {volitiles: 0, lithics: 1, metals: 0};
    radius = 0;
    scale = 1;

    constructor(public name: string, private engineService: EngineService, {
            radius = 1, mass = 1,
            composition = {volitiles: 0.1, lithics: 0.6, metals: 0.3}
    }, public orbit?: Orbit) {
        let scene = engineService.getScene();
        this.mesh = MeshBuilder.CreateSphere(name, {diameter: radius * 2}, scene);
        this.mesh.position = this.positionAt(0);
        this.material = new StandardMaterial(name + "Mat", scene);
        this.mesh.material = this.material;

        this.radius = radius;
        this.mass = mass;
        this.composition = composition;
        if(orbit) this.orbit?.primary.satellites.push(this);

        this.button = this.createButton();
        this.stats = new Array<TextBlock>(0);
        this.statBlock = this.createStatBlock();
    }

    private createButton() {
        let size = "20px";
        let offset = 14;

        let button = new Button(this.name +"_Button");
        button.adaptWidthToChildren = true;
        button.height = "60px";
        button.linkOffsetY = -offset;
        button.thickness = 0;

        this.engineService.getAdvancedTexture().addControl(button);
        button.linkWithMesh(this.mesh);

        let ellipse = new Ellipse();
        ellipse.width = size;
        ellipse.height = size;
        ellipse.color = "white";
        ellipse.thickness = 2;
        ellipse.background = "black";
        ellipse.top = offset + "px";
        button.addControl(ellipse);

        let label = new TextBlock(this.name + "_Label", this.name);
        label.color = "white";
        label.resizeToFit = true;
        label.fontSize = 12;
        button.addControl(label);
        return button;
    }

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
            this.stats.push(createStatText(container, i * (fontSize + padding)));
        }
        container.height = this.stats.length * fontSize;
        container.adaptWidthToChildren = true;

        this.stats[0].text = "M: " + scientificNotation(this.mass, 4) + " kg";
        this.stats[1].text = "R: " + scientificNotation(this.radius, 4) + " m";

        let width = container.width;
        width = typeof width == "string" ? Number.parseInt(width) : width
        container.linkOffsetX = width / 2 + 10 + padding;

        return container;
    }

    update(epoch: number, camera: Camera) {
        this.reposition(epoch);
        this.orbit?.update(epoch, camera);

        this.checkUIDisplay(camera);

        this.satellites.forEach(body => {
            body.update(epoch, camera);
        });
    }

    checkUIDisplay(camera: Camera) {
        if(!this.orbit) return;
        
        let cameraSquareDistance = camera.position.subtract(this.mesh.position).lengthSquared();
        let semiMajorSquare = (this.orbit.semimajor * this.scale) ** 2;
        let orbitFadeMin = semiMajorSquare / 100;
        let orbitfadeMax = semiMajorSquare / 10;
        let maximumButtonDisplay = semiMajorSquare * 8000;

        this.orbit.mesh.isVisible = cameraSquareDistance > orbitFadeMin && cameraSquareDistance < maximumButtonDisplay;
        if(cameraSquareDistance < orbitfadeMax) {
            this.orbit.material.alpha = (cameraSquareDistance - orbitFadeMin) / (orbitfadeMax - orbitFadeMin);
        }

        let uiVisible = cameraSquareDistance < maximumButtonDisplay;
        this.button.isVisible = uiVisible;
        this.statBlock.isVisible = uiVisible;
    }

    changeScale(scale: number) {
        this.scale = scale;
        this.mesh.scaling = new Vector3(scale, scale, scale);
        if(this.orbit) this.orbit.changeScale(scale * 2);
        this.satellites.forEach(body => body.changeScale(scale));
    }

    reposition(epoch: number): void {
        this.mesh.position = this.positionAt(epoch);
        this.orbit?.reposition(epoch);
    }

    positionAt(epoch: number): Vector3 {
        if(!this.orbit) return Vector3.Zero();
        return this.orbit.positionAt(epoch);
    }

    getCameraLowerLimit() {
        return this.radius * this.scale * 1.1;
    }
}

export class Planet extends Body {
    constructor(
        name: string, engineService: EngineService,
        {mass = 1, composition = {volitiles: 0.0003, lithics: 0.68, metals: 0.32}},
        orbit: Orbit
    ) {
        super(name, engineService, {
            radius: PlanetaryPhysics.radiusFromMassAndFractions(
                mass, composition.volitiles, composition.lithics, composition.metals
            ),
            mass, composition
        }, orbit);
    }
}

export class Star extends Body {
    light: Light;

    constructor(
        name: string, engineService: EngineService,
        {mass = AstralConstants.SOLAR_MASS, position = Vector3.Zero()},
        orbit?: Orbit
    ) {
        super(name, engineService, {radius: AstralConstants.SOLAR_RADIUS, mass}, orbit);
        this.material.emissiveColor = new Color3(1, 1, 0);
        this.light = new PointLight(name + "Light", position, engineService.getScene());
    }
}

