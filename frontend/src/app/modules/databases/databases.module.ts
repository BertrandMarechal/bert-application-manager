import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabasesComponent } from './databases.component';
import { DatabaseComponent } from './database/database.component';
import { TableComponent } from './database/table/table.component';
import { FieldComponent } from './database/field/field.component';
import { FunctionComponent } from './database/function/function.component';
import { DatabasesRoutingModule } from './databases-routing.module';
import { DetailsViewModule } from '../shared/details-view/details-view.module';
import { UtilsModule } from '../shared/utils/utils.module';
import { DatabasesMaterialModule } from './material/databases.material.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AngularSplitModule } from 'angular-split';
import { EditTableComponent } from './database/new-table/edit-table.component';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

@NgModule({
  declarations: [
    DatabasesComponent,
    DatabaseComponent,
    TableComponent,
    FieldComponent,
    FunctionComponent,
    EditTableComponent
  ],
  imports: [
    CommonModule,
    SweetAlert2Module,
    DatabasesRoutingModule,
    DatabasesMaterialModule,
    DetailsViewModule,
    UtilsModule,
    ReactiveFormsModule,
    FormsModule,
    AngularSplitModule,
  ]
})

export class DatabasesModule { }
