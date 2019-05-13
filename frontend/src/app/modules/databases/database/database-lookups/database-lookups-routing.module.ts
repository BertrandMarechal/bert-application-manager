import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DatabaseLookupsComponent } from './database-lookups.component';

const routes: Routes = [{
  path: '',
  component: DatabaseLookupsComponent,
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class DatabaseLookupsRoutingModule { }
