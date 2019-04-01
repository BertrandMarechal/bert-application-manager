import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import * as fromDatabaseTable from '@app/store/reducers/database-table.reducers';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent implements OnInit {
  filter: string;
  databaseTable$: Observable<fromDatabaseTable.State>;

  constructor(
    private store: Store<fromDatabaseTable.State>
  ) { }

  ngOnInit() {
    this.databaseTable$ = this.store.pipe(select('databaseTable'));
  }
}
