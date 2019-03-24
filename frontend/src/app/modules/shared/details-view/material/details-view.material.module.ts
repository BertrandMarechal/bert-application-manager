import { NgModule } from '@angular/core';
import {
  MatCardModule,
  MatIconModule,
  MatMenuModule,
  MatButtonModule,
  MatTabsModule,
} from '@angular/material';

@NgModule({
  imports: [
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTabsModule,
  ],
  exports: [
    MatCardModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTabsModule,
  ],
  declarations: []
})
export class DetailsViewMaterialModule {
}
