import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailsViewComponent } from './details-view.component';
import { DetailsViewMaterialModule } from './material/details-view.material.module';
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
    DetailsViewMaterialModule,
  ]
})
export class DetailsViewModule { }
