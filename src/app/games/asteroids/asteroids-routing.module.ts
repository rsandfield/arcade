import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AsteroidsComponent } from './asteroids.component';

const routes: Routes = [{ path: '', component: AsteroidsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AsteroidsRoutingModule { }