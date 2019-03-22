import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabasesComponent } from './databases.component';
import { DatabaseComponent } from './database/database.component';
import { TableComponent } from './database/table/table.component';
import { FieldComponent } from './database/field/field.component';
import { FunctionComponent } from './database/function/function.component';

@NgModule({
  declarations: [DatabasesComponent, DatabaseComponent, TableComponent, FieldComponent, FunctionComponent],
  imports: [
    CommonModule
  ]
})
export class DatabasesModule { }
