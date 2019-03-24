import {NgModule} from '@angular/core';
import {
    MatListModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatButtonModule,
} from '@angular/material';

@NgModule({
  imports: [
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
  ],
  exports: [
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
  ],
  declarations: []
})
export class DatabasesMaterialModule {
}
