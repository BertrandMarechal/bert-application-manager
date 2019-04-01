import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TablesComponent } from './tables/tables.component';
import { TableComponent } from './table/table.component';
import { EditTableComponent } from './edit-table/edit-table.component';

const routes: Routes = [{
  path: '',
  component: TablesComponent,
  children: [{
    path: 'new',
    component: EditTableComponent
  }, {
    path: ':name/:version',
    component: TableComponent
  }, {
    path: ':name/:version/edit',
    component: EditTableComponent
  }]
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class DatabaseTableRoutingModule { }
