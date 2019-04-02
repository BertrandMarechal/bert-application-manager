import { Component, OnInit } from '@angular/core';
import * as fromApp from '@app/store/reducers/app.reducers';
import * as AppActions from '@app/store/actions/app.actions';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  app$: Observable<fromApp.State>;

  environments = [
    'local',
    'dev',
    'demo',
    'prod',
  ];

  constructor(
    private store: Store<fromApp.State>
  ) { }

  ngOnInit() {
    this.app$ = this.store.pipe(select('app'));
  }

  onChangeEnvironment(value: string) {
    console.log(value);
    this.store.dispatch(new AppActions.PageSetEnvironment(value));
  }
}
