import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MenagerieRoutingModule } from './menagerie-routing.module';
import { MenagerieComponent } from './menagerie.component';


@NgModule({
  declarations: [
    MenagerieComponent
  ],
  imports: [
    CommonModule,
    MenagerieRoutingModule
  ]
})
export class MenagerieModule { }
