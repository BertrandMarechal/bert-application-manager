import { Component, OnInit, ViewChild } from '@angular/core';

import * as fromDatabaseTable from '@app/store/reducers/database-table.reducers'
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MatTableDataSource, MatPaginator, MatSort, MatTable } from '@angular/material';
import { DatabaseTable } from '@app/models/database-file.model';
@Component({
  selector: 'app-tables',
  templateUrl: './tables.component.html',
  styleUrls: ['./tables.component.scss']
})
export class TablesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('matTable') matTable: MatTable<DatabaseTable>;

  filter: string;
  databaseTable$: Observable<fromDatabaseTable.State>;
  displayedColumns: string[] = ['name'];
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
