import {NgModule} from '@angular/core';
import {
    MatListModule, MatCardModule, MatButtonModule,
} from '@angular/material';

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
