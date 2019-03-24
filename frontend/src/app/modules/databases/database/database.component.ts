import { Component, OnInit } from '@angular/core';
import * as fromDatabases from '@app/store/reducers/databases.reducers';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { DatabaseTable } from '@app/models/database-file.model';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss']
})
export class DatabaseComponent implements OnInit {
  databases$: Observable<fromDatabases.FeatureState>;

  constructor(private store: Store<fromDatabases.State>) {}

  filter: string;
  databaseTable: DatabaseTable;

  ngOnInit() {
    this.databases$ = this.store.pipe(select('databases'));
  }

  onClickTable(table: DatabaseTable) {
    this.databaseTable = table;
  }
}
