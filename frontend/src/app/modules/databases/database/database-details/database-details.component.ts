import { Component, OnInit } from '@angular/core';
import * as fromDatabases from '@app/store/reducers/databases.reducers';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';

@Component({
  selector: 'app-database-details',
  templateUrl: './database-details.component.html',
  styleUrls: ['./database-details.component.scss']
})
export class DatabaseDetailsComponent implements OnInit {

  databases$: Observable<fromDatabases.State>;
  constructor(
    private store: Store<fromDatabases.State>,
  ) { }

  ngOnInit() {
    this.databases$ = this.store.pipe(select('databases'));
  }

}
