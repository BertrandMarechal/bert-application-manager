import { NgModule, ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ApplicationsComponent } from './applications.component';
import { ApplicationComponent } from './application/application.component';

const routes: Routes = [{
  path: '',
  component: ApplicationsComponent,
  children: [{
    path: ':name',
    component: ApplicationComponent,
  }]
}];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ApplicationsRoutingModule { }
