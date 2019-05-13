import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DatabaseDetailsComponent } from './database-details.component';

const routes: Routes = [{
  path: '',
  component: DatabaseDetailsComponent,
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class DatabaseDetailsRoutingModule { }
