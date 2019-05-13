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
        path: 'details',
        loadChildren: './database/database-details/database-details.module#DatabaseDetailsModule'
      },
      {
        path: 'lookups',
        loadChildren: './database/database-lookups/database-lookups.module#DatabaseLookupsModule'
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'details'
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
