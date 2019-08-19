import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';

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
