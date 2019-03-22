import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationsComponent } from './applications.component';
import { ApplicationComponent } from './application/application.component';

@NgModule({
  declarations: [ApplicationsComponent, ApplicationComponent],
  imports: [
    CommonModule
  ]
})
export class ApplicationsModule { }
