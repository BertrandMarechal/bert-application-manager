import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginatedTableComponent } from './paginated-table.component';
import { PaginatedTableMaterialModule } from './material/paginated-table.material.module';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    PaginatedTableComponent
  ],
  exports: [
    PaginatedTableComponent
  ],
  imports: [
    RouterModule,
    CommonModule,
    PaginatedTableMaterialModule,
    FormsModule,
  ]
})
export class PaginatedTableModule { }
