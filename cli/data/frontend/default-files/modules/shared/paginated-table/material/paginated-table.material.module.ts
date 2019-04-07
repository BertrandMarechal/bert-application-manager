import { NgModule } from '@angular/core';
import {
  MatTableModule,
} from '@angular/material';

@NgModule({
  imports: [
    MatTableModule,
  ],
  exports: [
    MatTableModule,
  ],
  declarations: []
})
export class PaginatedTableMaterialModule {
}
