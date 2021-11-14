import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TetrisRoutingModule } from './tetris-routing.module';
import { TetrisComponent } from './tetris.component';


@NgModule({
  declarations: [
    TetrisComponent
  ],
  imports: [
    CommonModule,
    TetrisRoutingModule
  ]
})
export class TetrisModule { }
