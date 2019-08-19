import {NgModule} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

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
