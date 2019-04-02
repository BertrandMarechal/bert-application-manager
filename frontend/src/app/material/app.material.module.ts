import {NgModule} from '@angular/core';
import {
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
} from '@angular/material';

@NgModule({
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  exports: [
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule,
    MatListModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  declarations: []
})
export class AppMaterialModule {
}
