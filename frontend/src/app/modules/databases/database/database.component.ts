import { Component, OnInit } from '@angular/core';
import * as fromDatabases from '@app/store/reducers/databases.reducers';
import * as DatabasesActions from '@app/store/actions/databases.actions';
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

  constructor(
    private store: Store<fromDatabases.State>
  ) { }

  filter: string;
  databaseTable: DatabaseTable;
  actions = [{
    name: 'Add table',
    value: 'add-table'
  }, {
    name: 'Generate Functions',
    value: 'generate-functions'
  }];

  ngOnInit() {
    this.databases$ = this.store.pipe(select('databases'));
  }

  onClickTable(table: DatabaseTable) {
    this.databaseTable = table;
  }

  onActionClicked(action: { name: string; value: string; }) {
    if (action.value === 'add-table') {
      this.store.dispatch(new DatabasesActions.PageCreateDatabaseTable());
    } else if (action.value === 'generate-functions') {
      this.store.dispatch(new DatabasesActions.PageCreateDatabaseFunctions());
    }
  }
}
