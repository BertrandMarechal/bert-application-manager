import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailsViewComponent } from './paginated-table.component';
import { PaginatedTableMaterialModule } from './material/paginated-table.material.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    DetailsViewComponent
  ],
  exports: [
    DetailsViewComponent
  ],
  imports: [
    RouterModule,
    CommonModule,
    PaginatedTableMaterialModule,
  ]
})
export class DetailsViewModule { }
