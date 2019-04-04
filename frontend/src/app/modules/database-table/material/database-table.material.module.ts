import { NgModule } from '@angular/core';
import { MatButtonModule, MatCheckboxModule,
  MatFormFieldModule, MatIconModule, MatInputModule, MatListModule,
  MatPaginatorModule, MatSelectModule, MatSortModule, MatTableModule, MatMenuModule } from '@angular/material';

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
    MatMenuModule,
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
    MatMenuModule,
  ],
  declarations: []
})
export class DatabaseTableMaterialModule {
}
