import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  { path: 'asteroids', loadChildren: () => import('./games/asteroids/asteroids.module').then(m => m.AsteroidsModule) },
  { path: 'menagerie', loadChildren: () => import('./games/menagerie/menagerie.module').then(m => m.MenagerieModule) },
  { path: '', loadChildren: () => import('./resume/resume.module').then(m => m.ResumeModule) },
  { path: 'tetris', loadChildren: () => import('./games/tetris/tetris.module').then(m => m.TetrisModule) },
  { path: 'orrery', loadChildren: () => import('./tools/orrery/orrery.module').then(m => m.OrreryModule) },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
