import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationsComponent } from './applications.component';
import { ApplicationComponent } from './application/application.component';
import { ApplicationsRoutingModule } from './applications-routing.module';
import { ApplicationsMaterialModule } from './material/applications.material.module';
import { AngularSplitModule } from 'angular-split';
import { DetailsViewModule } from '../shared/details-view/details-view.module';

@NgModule({
  declarations: [
    ApplicationsComponent,
    ApplicationComponent
  ],
  imports: [
    CommonModule,
    AngularSplitModule,
    ApplicationsRoutingModule,
    ApplicationsMaterialModule,
    DetailsViewModule,
  ]
})
export class ApplicationsModule { }
