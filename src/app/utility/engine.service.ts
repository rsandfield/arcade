import {ElementRef, Injectable, NgZone} from '@angular/core';
import {
  Engine,
  FreeCamera,
  Scene,
  Light,
  Mesh,
  Color3,
  Color4,
  Vector3,
  PointLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  DynamicTexture,
  Space,
  AssetsManager,
  Camera,
  UniversalCamera,
  ArcRotateCamera
} from '@babylonjs/core';
import { AdvancedDynamicTexture, Button } from '@babylonjs/gui';
import { WindowRefService } from './window-ref.service';

@Injectable({ providedIn: 'root' })
export class EngineService {
  private canvas?: HTMLCanvasElement;
  private engine?: Engine;
  private camera?: ArcRotateCamera;
  private scene?: Scene;
  private overlay?: Scene;
  private assetManager?: AssetsManager;
  private advancedTexture?: AdvancedDynamicTexture;

  public constructor(
    private ngZone: NgZone,
    private windowRef: WindowRefService
  ) {}

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    this.canvas = canvas.nativeElement;

    this.engine = new Engine(this.canvas,  true);

    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0, 0, 0, 0);

    this.camera = new ArcRotateCamera('camera1', 0, 0, 1000, Vector3.Zero(), this.scene);
    this.camera.attachControl(this.canvas, false);
    this.camera.lowerRadiusLimit = 1;

    this.overlay = new Scene(this.engine);
    this.overlay.clearColor = new Color4(0, 0, 0, 0);

    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, this.scene);
    
    this.assetManager = new AssetsManager(this.scene);
  }

  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      const rendererLoopCallback = () => {
        this.scene?.render();
      };

      if (this.windowRef.document.readyState !== 'loading') {
        this.engine?.runRenderLoop(rendererLoopCallback);
      } else {
        this.windowRef.window.addEventListener('DOMContentLoaded', () => {
          this.engine?.runRenderLoop(rendererLoopCallback);
        });
      }

      this.windowRef.window.addEventListener('resize', () => {
        this.engine?.resize();
      });
    });
  }

  public getAssetManager(): AssetsManager {
    if(!this.assetManager) throw new Error("Engine has no asset manager");
    return this.assetManager;
  }

  public getScene(): Scene {
    if(!this.scene) throw new Error("Engine has no scene!");
    return this.scene;
  }

  public getCamera(): ArcRotateCamera {
    if(!this.camera) throw new Error("Engine has no camera!");
    return this.camera;
  }

  public getAdvancedTexture(): AdvancedDynamicTexture {
    if(!this.advancedTexture) throw new Error("Engine has no UI layer!");
    return this.advancedTexture;
  }
}