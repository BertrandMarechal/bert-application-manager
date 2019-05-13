import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseLookupsComponent } from './database-lookups.component';
import { DatabaseLookupsRoutingModule } from './database-lookups-routing.module';

@NgModule({
  declarations: [
    DatabaseLookupsComponent
  ],
  imports: [
    CommonModule,
    DatabaseLookupsRoutingModule,
  ]
})
export class DatabaseLookupsModule { }
