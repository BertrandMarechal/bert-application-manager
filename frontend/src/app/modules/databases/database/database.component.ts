import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DatabaseSubObject } from '@app/models/database-file.model';
import * as DatabasesActions from '@app/store/actions/databases.actions';
import * as fromDatabases from '@app/store/reducers/databases.reducers';
import { select, Store } from '@ngrx/store';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-database',
  templateUrl: './database.component.html',
  styleUrls: ['./database.component.scss']
})
export class DatabaseComponent implements OnInit {
  databases$: Observable<fromDatabases.State>;
  @ViewChild('swalTemplate') swalTemplate: SwalComponent;
  templateFormControl: FormControl;

  constructor(
    private store: Store<fromDatabases.State>,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) { }

  filter: string;
  databaseFunction: DatabaseSubObject;
  editTable: boolean;
  editFunction: boolean;
  actions: {
    name: string;
    value: string;
  }[];

  ngOnInit() {
    this.templateFormControl = new FormControl();
    this.databases$ = this.store.pipe(select('databases'));
    this.databases$.subscribe((state: fromDatabases.State) => {

      this.actions = [];
      if (!state.database || !state.database._properties.dbName) {
        this.actions.push({
          name: 'Refresh',
          value: 'refresh'
        });
        this.actions.push({
          name: 'Initialize',
          value: 'init'
        });
      } else {
        this.actions.push({
          name: 'Refresh',
          value: 'refresh'
        });
        this.actions.push({
          name: 'Add table',
          value: 'add-table'
        });
        this.actions.push({
          name: 'Generate Functions',
          value: 'generate-functions'
        });
        this.actions.push({
          name: 'Add Template',
          value: 'add-template'
        });
        if (state.database._properties.hasCurrent) {
          this.actions.push({
            name: 'Create version',
            value: 'create-version'
          });
        }
      }
    });
  }
  onClickFunction(f: DatabaseSubObject) {
    this.databaseFunction = f;
  }

  onActionClicked(action: { name: string; value: string; }) {
    if (action.value === 'add-table') {
      this.router.navigate(['tables', 'new'], { relativeTo: this.activatedRoute });
    } else if (action.value === 'generate-functions') {
      this.store.dispatch(new DatabasesActions.PageCreateDatabaseFunctions());
    } else if (action.value === 'init') {
      this.store.dispatch(new DatabasesActions.PageInitializeDatabase());
    } else if (action.value === 'refresh') {
      this.store.dispatch(new DatabasesActions.PageRefresh());
    } else if (action.value === 'create-version') {
      this.store.dispatch(new DatabasesActions.PageCreateVersion());
    } else if (action.value === 'add-template') {
      this.templateFormControl.reset();
      this.swalTemplate.show();
    }
  }

  onChoseTemplate() {
    this.store.dispatch(new DatabasesActions.PageAddTemplate(this.templateFormControl.value));
  }
}
