//https://github.com/JohnnyDevNull/ng-babylon-template
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { EngineService } from 'src/app/utility/engine.service';
import { addTimeToDate } from 'src/app/utility/utilities';
import { Body } from './body';
import { SystemLoader } from './system-loader';

@Component({
  selector: 'app-orrery',
  templateUrl: './orrery.component.html',
  styleUrls: ['./orrery.component.scss'],
  providers: [EngineService]
})
export class OrreryComponent implements OnInit {
  @ViewChild('canvas', { static: true })
  public canvas?: ElementRef<HTMLCanvasElement>;
  private root?: Body;
  epochStart = new Date();
  epochCurrent = new Date();
  speed = 10000;
  scale = 10 ** -9;

  constructor(private engineService: EngineService) { }

  ngOnInit(): void {
    if(!this.canvas) throw new Error("No canvas");
    this.engineService.createScene(this.canvas);
    this.engineService.animate();

    this.loadCamera();
    this.loadSystem()
    .then(_ => {
      if(!this.root) throw new Error("System failed to load!");
      this.setCameraTarget(this.root.satellites[2]);
    });

    setInterval(this.update.bind(this), 1000.0/60.0);
  }

  async loadSystem() {
    let loader = new SystemLoader("assets/orrery/solarsystem.txt", this, this.engineService);
    await loader.loadSystem()
    .then(_ => {
      this.epochStart = loader.epochStart;
      this.epochCurrent = this.epochStart;
      this.root = loader.root;
    });
    
  }

  loadCamera() {
    let camera = this.engineService.getCamera()
    camera.maxZ = 30000;
    camera.upperRadiusLimit = 25000;
    camera.wheelDeltaPercentage = 0.01;
    camera.minZ = 0.0001;
  }

  update() {
    this.epochCurrent = addTimeToDate(this.epochCurrent, this.speed);
    if(this.root) {
      this.root.update(this.epochCurrent.getTime(), this.engineService.getCamera());
    }
  }

  setCameraTarget(target: Body) {
    let camera = this.engineService.getCamera();
    camera.lockedTarget = (target.mesh);
    camera.lowerRadiusLimit = target.getCameraLowerLimit();
    camera.speed = 1;
  }
}
