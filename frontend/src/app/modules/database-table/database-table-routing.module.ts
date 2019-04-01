import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TablesComponent } from './tables/tables.component';
import { TableComponent } from './table/table.component';

const routes: Routes = [{
  path: '',
  component: TablesComponent,
  children: [{
    path: ':name/:version',
    component: TableComponent
  }]
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class DatabaseTableRoutingModule { }
