import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import * as fromApplications from '@app/store/reducers/applications.reducers';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {
  applications$: Observable<fromApplications.FeatureState>;

  constructor(private store: Store<fromApplications.State>) {}

  ngOnInit() {
    this.applications$ = this.store.pipe(select('applications'));
  }
}
