import { Component, OnInit, ViewChild } from '@angular/core';

import * as fromDatabaseTable from '@app/store/reducers/database-table.reducers';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { DatabaseTable } from '@app/models/database-file.model';
@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('matTable', { static: true }) matTable: MatTable<DatabaseTable>;

  filter: string;
  databaseTable$: Observable<fromDatabaseTable.State>;
  displayedColumns: string[] = ['name', 'latestVersion'];
  dataSource: MatTableDataSource<DatabaseTable>;

  constructor(
    private store: Store<fromDatabaseTable.State>
  ) { }

  ngOnInit() {
    this.databaseTable$ = this.store.pipe(select('databaseTable'));
    this.databaseTable$.subscribe((state: fromDatabaseTable.State) => {
      this.dataSource = new MatTableDataSource(Object.keys(state.databaseTables).map(k => state.databaseTables[k]));
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

}
