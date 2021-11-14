import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AsteroidsRoutingModule } from './asteroids-routing.module';
import { AsteroidsComponent } from './asteroids.component';


@NgModule({
  declarations: [
    AsteroidsComponent
  ],
  imports: [
    CommonModule,
    AsteroidsRoutingModule
  ]
})
export class AsteroidsModule { }
