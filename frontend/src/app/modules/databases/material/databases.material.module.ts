import { NgModule } from '@angular/core';
import { MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule,
  MatInputModule, MatSelectModule, MatTabsModule, MatMenuModule } from '@angular/material';

@NgModule({
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MatMenuModule,
  ],
  exports: [
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MatMenuModule,
  ],
  declarations: []
})
export class DatabasesMaterialModule {
}
