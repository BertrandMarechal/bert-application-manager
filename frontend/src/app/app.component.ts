import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';
import * as fromConsole from '@app/store/reducers/console.reducers';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  console$: Observable<fromConsole.State>;


  constructor(
    private store: Store<fromConsole.State>
  ) { }

  ngOnInit() {
    this.console$ = this.store.pipe(select('console'));
  }
}
