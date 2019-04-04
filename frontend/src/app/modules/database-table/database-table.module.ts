import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatabaseTableEffects } from '@app/store/effects/database-table.effect';
import { databaseTableReducers } from '@app/store/reducers/database-table.reducers';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { AngularSplitModule } from 'angular-split';
import { DatabaseTableRoutingModule } from './database-table-routing.module';
import { DatabaseTableComponent } from './database-table.component';
import { DatabaseTableMaterialModule } from './material/database-table.material.module';
import { TablesComponent } from './tables/tables.component';
import { UtilsModule } from '../shared/utils/utils.module';
import { TableComponent } from './table/table.component';
import { FieldComponent } from './field/field.component';
import { EditTableComponent } from './edit-table/edit-table.component';
import { DatabaseTagComponent } from './database-tag/database-tag.component';

@NgModule({
  declarations: [
    DatabaseTableComponent,
    TablesComponent,
    TableComponent,
    FieldComponent,
    EditTableComponent,
    DatabaseTagComponent,
  ],
  imports: [
    CommonModule,
    DatabaseTableMaterialModule,
    DatabaseTableRoutingModule,
    SweetAlert2Module,
    UtilsModule,
    ReactiveFormsModule,
    FormsModule,
    AngularSplitModule,
    StoreModule.forFeature('databaseTable', databaseTableReducers),
    EffectsModule.forFeature([
      DatabaseTableEffects,
    ])
  ]
})
export class DatabaseTableModule { }
