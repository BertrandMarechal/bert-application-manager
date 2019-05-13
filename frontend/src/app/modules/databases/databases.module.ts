import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DatabasesEffects } from '@app/store/effects/databases.effect';
import { databasesReducers } from '@app/store/reducers/databases.reducers';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { DetailsViewModule } from '../shared/details-view/details-view.module';
import { UtilsModule } from '../shared/utils/utils.module';
import { DatabaseComponent } from './database/database.component';
import { FunctionComponent } from './database/function/function.component';
import { DatabasesRoutingModule } from './databases-routing.module';
import { DatabasesComponent } from './databases.component';
import { DatabasesMaterialModule } from './material/databases.material.module';

@NgModule({
  declarations: [
    DatabasesComponent,
    DatabaseComponent,
    FunctionComponent,
  ],
  imports: [
    CommonModule,
    SweetAlert2Module,
    DatabasesRoutingModule,
    DatabasesMaterialModule,
    DetailsViewModule,
    FormsModule,
    ReactiveFormsModule,
    UtilsModule,
    StoreModule.forFeature('databases', databasesReducers),
    EffectsModule.forFeature([
      DatabasesEffects,
    ])
  ]
})

export class DatabasesModule { }
