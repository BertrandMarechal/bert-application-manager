import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditionButtonsComponent } from './edition-buttons.component';
import { EditionButtonsMaterialModule } from './material/edition-buttons.material.module';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    EditionButtonsComponent
  ],
  exports: [
    EditionButtonsComponent
  ],
  imports: [
    RouterModule,
    CommonModule,
    EditionButtonsMaterialModule,
  ]
})
export class EditionButtonsModule { }
