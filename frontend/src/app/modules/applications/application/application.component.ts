import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as fromApplications from '@app/store/reducers/applications.reducers';

@Component({
  selector: 'app-application',
  templateUrl: './application.component.html',
  styleUrls: ['./application.component.scss']
})
export class ApplicationComponent implements OnInit {
  applications$: Observable<fromApplications.FeatureState>;

  constructor(private store: Store<fromApplications.State>) {}

  ngOnInit() {
    this.applications$ = this.store.pipe(select('applications'));
  }
}
