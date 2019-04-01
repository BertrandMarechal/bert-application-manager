import { NgModule } from '@angular/core';
import { MatButtonModule, MatCheckboxModule,
  MatFormFieldModule, MatIconModule, MatInputModule, MatListModule,
  MatPaginatorModule, MatSelectModule, MatSortModule, MatTableModule } from '@angular/material';

@NgModule({
  imports: [
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
  ],
  exports: [
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
  ],
  declarations: []
})
export class DatabaseTableMaterialModule {
}
