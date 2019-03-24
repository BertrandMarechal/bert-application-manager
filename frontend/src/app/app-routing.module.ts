import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [{
  path: 'applications',
  loadChildren: './modules/applications/applications.module#ApplicationsModule'
}, {
  path: 'databases',
  loadChildren: './modules/databases/databases.module#DatabasesModule'
}];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
