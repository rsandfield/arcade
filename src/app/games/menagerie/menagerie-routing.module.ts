import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenagerieComponent } from './menagerie.component';

const routes: Routes = [{ path: '', component: MenagerieComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MenagerieRoutingModule { }
