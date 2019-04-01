import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DatabasesComponent } from './databases.component';
import { DatabaseComponent } from './database/database.component';

const routes: Routes = [{
  path: '',
  component: DatabasesComponent,
  children: [{
    path: ':name',
    component: DatabaseComponent,
    children: [
      {
        path: 'tables',
        loadChildren: '../database-table/database-table.module#DatabaseTableModule'
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tables'
      }
    ]
  }]
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class DatabasesRoutingModule { }
