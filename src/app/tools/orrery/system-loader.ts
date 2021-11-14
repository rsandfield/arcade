import { Scene } from "@babylonjs/core";
import { EngineService } from "src/app/utility/engine.service";
import { textToDate } from "src/app/utility/utilities";
import { Body, Planet, Star } from "./body";
import { Orbit } from "./orbit";
import { OrreryComponent } from "./orrery.component";

enum FILECOLUMNS {
    TYPE,
    NAME,
    SATELLITES,
    ASCENDING_NODE,
    INCLINATION,
    PERIAPSIS_ARGUMENT,
    SEMIMAJOR_SIG,
    SEMIMAJOR_EXP,
    ECCENTRICITY,
    MEAN_ANOMALY,
    MASS_SIG,
    MASS_EXP
}

export class SystemLoader {
    epochStart = new Date();
    root?: Body;
    scene: Scene;
    ready = false;

    constructor(public filename: string, private orrery: OrreryComponent, private engineService: EngineService) {
        this.scene = engineService.getScene();
    }    

    async loadSystem() {
        this.ready = false;
        await fetch(this.filename)
        .then(response => response.text())
        .then(data => {
            let lines = data.split('\n');
            let lineNumber = Number.parseInt(lines[1]);
            this.epochStart = textToDate(lines[lineNumber]);
            this.root = this.parseSubsystem(lines.slice(lineNumber + 2), null);
            this.root.changeScale(this.orrery.scale);
            this.ready = true;
        });
    }

    parseSubsystem(data: string[], primary: Body | null) {
        let line = data[0].split(" ").filter(i => i);
        let type = line[FILECOLUMNS.TYPE];
        let name = line[FILECOLUMNS.NAME];
        
        let mass = Number.parseFloat(line[FILECOLUMNS.MASS_SIG]) *
            10 ** Number.parseInt(line[FILECOLUMNS.MASS_EXP]);
        let orbitalParameters = {
            ascendingNode: Number.parseFloat(line[FILECOLUMNS.ASCENDING_NODE]),
            inclination: Number.parseFloat(line[FILECOLUMNS.INCLINATION]),
            periapsis: Number.parseFloat(line[FILECOLUMNS.PERIAPSIS_ARGUMENT]),
            semimajor: Number.parseFloat(line[FILECOLUMNS.SEMIMAJOR_SIG]) *
                10 ** Number.parseInt(line[FILECOLUMNS.SEMIMAJOR_EXP]),
            eccentricity: Number.parseFloat(line[FILECOLUMNS.ECCENTRICITY]),
            meanAnomaly: Number.parseFloat(line[FILECOLUMNS.MEAN_ANOMALY]),
        };

        let body: Body;
        switch(type) {
        case "Star":
            body = new Star(name, this.engineService, {mass});
            if(primary) body.orbit = new Orbit(name, primary, this.scene, orbitalParameters);
            break;
        case "Planet":
            if(!primary) throw new Error("Planets must have a primary body to orbit!");
            body = new Planet(name, this.engineService, {mass}, new Orbit(name, primary, this.scene, orbitalParameters));
            break;
        default:
            body = new Body(name, this.engineService, {});
            break;
        }
        
        let satelliteCount = Number.parseInt(line[FILECOLUMNS.SATELLITES]);
        let satellites = [];
        let i = 1;
        while(satellites.length < satelliteCount) {
        let count = Number.parseInt(data[i].split(" ").filter(i => i)[2]);
        let subsystem = data.slice(i, i + count + 1);
        satellites.push(this.parseSubsystem(subsystem, body));
        i += 1 + count;
        }
        body.satellites = satellites;
        body.button.onPointerClickObservable.add(event => this.orrery.setCameraTarget(body))

        return body;
    }
}