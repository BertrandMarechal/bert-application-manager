import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ReactiveFormsModule } from '@angular/forms';
import { AngularSplitModule } from 'angular-split';
import { PaginatedTableModule } from '@app/modules/shared/paginated-table/paginated-table.module';
import { DetailsViewModule } from '@app/modules/shared/details-view/details-view.module';
import { DetailsContainerModule } from '@app/modules/shared/details-container/details-container.module';
import { EditionButtonsModule } from '@app/modules/shared/edition-buttons/edition-buttons.module';

import {<capitalized_camel_cased_name>MaterialModule} from './material/<name_with_dashes>-material.module';
import {<capitalized_camel_cased_name>RoutingModule} from './<name_with_dashes>.routing';

import {<camel_cased_name>Reducers} from '@app/store/reducers/<name_with_dashes>.reducers';
import {<capitalized_camel_cased_name>Effects} from '@app/store/effects/<name_with_dashes>.effects';

<components_imports>

@NgModule({
  declarations: [
    <components_class_names>
  ],
  imports: [
    CommonModule,
    AngularSplitModule,
    <capitalized_camel_cased_name>RoutingModule,
    <capitalized_camel_cased_name>MaterialModule,
    ReactiveFormsModule,
    DetailsViewModule,
    PaginatedTableModule,
    DetailsContainerModule,
    EditionButtonsModule,
    StoreModule.forFeature('<camel_cased_name>', <camel_cased_name>Reducers),
    EffectsModule.forFeature([
      <capitalized_camel_cased_name>Effects,
    ]),
  ]
})
export class <capitalized_camel_cased_name>Module { }
