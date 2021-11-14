import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrreryComponent } from './orrery.component';

const routes: Routes = [{ path: '', component: OrreryComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrreryRoutingModule { }
