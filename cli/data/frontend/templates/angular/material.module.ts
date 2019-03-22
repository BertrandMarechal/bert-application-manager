import {NgModule} from '@angular/core';
import {MatFormFieldModule, MatInputModule, MatProgressBarModule, MatSelectModule} from '@angular/material';

@NgModule({
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  exports: [
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
  ]
})
export class <capitalized_camel_cased_name>MaterialModule {
}
