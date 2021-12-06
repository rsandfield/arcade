import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AsteroidsComponent } from './games/asteroids/asteroids.component';
import { TetrisComponent } from './games/tetris/tetris.component';

const routes: Routes = [
  { path: 'asteroids', component: AsteroidsComponent },
  { path: 'tetris', component: TetrisComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
