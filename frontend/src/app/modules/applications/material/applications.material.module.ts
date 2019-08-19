import {NgModule} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@NgModule({
  imports: [
    MatListModule,
    MatButtonModule,
  ],
  exports: [
    MatListModule,
    MatButtonModule,
  ],
  declarations: []
})
export class ApplicationsMaterialModule {
}
