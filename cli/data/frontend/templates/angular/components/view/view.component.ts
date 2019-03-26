import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import * as from<capitalized_camel_cased_name> from '@app/store/reducers/<name_with_dashes>.reducers';
import {Store} from '@ngrx/store';

@Component({
  selector: 'app-<name_with_dashes>-details',
  templateUrl: './<name_with_dashes>-details.component.html'
})
export class <capitalized_camel_cased_name>DetailsComponent implements OnInit {
  <camel_cased_name>Store$: Observable<from<capitalized_camel_cased_name>.State>;

  constructor(private store: Store<from<capitalized_camel_cased_name>.FeatureState>) { }

  ngOnInit() {
    this.<camel_cased_name>Store$ = this.store.select('<camel_cased_name>Store');
  }
}
