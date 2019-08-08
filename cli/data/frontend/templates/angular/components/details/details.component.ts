import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import * as from<capitalized_camel_cased_name> from '@app/store/reducers/<name_with_dashes>.reducers';
import {EntityDetailContainer} from '@app/modules/shared/details-container/details-container.component';
import {Store} from '@ngrx/store';
import {<capitalized_camel_cased_name>} from '@app/models/<name_with_dashes>.model';

@Component({
  selector: 'app-<name_with_dashes>-details',
  templateUrl: './<name_with_dashes>-details.component.html'
})
export class <capitalized_camel_cased_name>DetailsComponent implements OnInit {
  <camel_cased_name>$: Observable<from<capitalized_camel_cased_name>.State>;
  <camel_cased_name>Details: EntityDetailContainer<<capitalized_camel_cased_name>>[];

  constructor(private store: Store<from<capitalized_camel_cased_name>.FeatureState>) { }

  ngOnInit() {
    this.<camel_cased_name>$ = this.store.select('<camel_cased_name>');
    this.<camel_cased_name>Details = [{
      name: 'Details',
      entityDetails: [
<fields_details>
      ]
    }];
  }
}
