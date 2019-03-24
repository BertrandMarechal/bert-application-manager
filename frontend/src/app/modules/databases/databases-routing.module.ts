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
  }]
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class DatabasesRoutingModule { }
