import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TetrisComponent } from './games/tetris/tetris.component';
import { TetrisModule } from './games/tetris/tetris.module';

const routes: Routes = [
  { path: 'tetris', component: TetrisComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
