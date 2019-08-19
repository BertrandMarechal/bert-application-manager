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
        loadChildren: () => import('../database-table/database-table.module').then(m => m.DatabaseTableModule)
      },
      {
        path: 'details',
        loadChildren: () => import('./database/database-details/database-details.module').then(m => m.DatabaseDetailsModule)
      },
      {
        path: 'lookups',
        loadChildren: () => import('./database/database-lookups/database-lookups.module').then(m => m.DatabaseLookupsModule)
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
