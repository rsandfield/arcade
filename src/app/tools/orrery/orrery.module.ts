import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrreryRoutingModule } from './orrery-routing.module';
import { OrreryComponent } from './orrery.component';


@NgModule({
  declarations: [
    OrreryComponent
  ],
  imports: [
    CommonModule,
    OrreryRoutingModule
  ]
})
export class OrreryModule { }
