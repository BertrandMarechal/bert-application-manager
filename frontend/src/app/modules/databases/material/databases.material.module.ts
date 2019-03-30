import {NgModule} from '@angular/core';
import {
    MatListModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, MatButtonModule, MatCheckboxModule, MatTabsModule,
} from '@angular/material';

@NgModule({
  imports: [
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
  ],
  exports: [
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
  ],
  declarations: []
})
export class DatabasesMaterialModule {
}
