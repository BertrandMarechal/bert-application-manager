import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseDetailsComponent } from './database-details.component';
import { MatListModule } from '@angular/material';
import { DatabaseDetailsRoutingModule } from './database-details-routing.module';

@NgModule({
  declarations: [
    DatabaseDetailsComponent
  ],
  imports: [
    DatabaseDetailsRoutingModule,
    CommonModule,
    MatListModule,
  ]
})

export class DatabaseDetailsModule { }
