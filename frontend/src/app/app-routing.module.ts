import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [{
  path: 'applications',
  loadChildren: () => import('./modules/applications/applications.module').then(m => m.ApplicationsModule)
}, {
  path: 'databases',
  loadChildren: () => import('./modules/databases/databases.module').then(m => m.DatabasesModule)
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
