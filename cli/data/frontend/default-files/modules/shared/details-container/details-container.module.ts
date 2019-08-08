import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailsContainerComponent } from './details-container.component';
import { DetailContainerConditionFilterPipe } from './detail-container-condition-filter.pipe';
import { DetailsContainerMaterialModule } from './material/details-container.material.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    DetailsContainerComponent,
    DetailContainerConditionFilterPipe,
  ],
  exports: [
    DetailsContainerComponent
  ],
  imports: [
    RouterModule,
    CommonModule,
    DetailsContainerMaterialModule,
  ]
})
export class DetailsContainerModule { }
