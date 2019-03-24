import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObjectKeysPipe } from './object-keys.pipe';
import { ObjectListFilterPipe } from './object-list-filter.pipe';

@NgModule({
  declarations: [
    ObjectKeysPipe,
    ObjectListFilterPipe,
  ],
  exports: [
    ObjectKeysPipe,
    ObjectListFilterPipe,
  ],
  imports: [
    CommonModule
  ]
})
export class UtilsModule { }
