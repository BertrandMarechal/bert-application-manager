import {NgModule} from '@angular/core';
import {
    MatListModule, MatCardModule, MatButtonModule,
} from '@angular/material';

@NgModule({
  imports: [
    MatListModule,
    MatCardModule,
    MatButtonModule,
  ],
  exports: [
    MatListModule,
    MatCardModule,
    MatButtonModule,
  ],
  declarations: []
})
export class ApplicationsMaterialModule {
}
