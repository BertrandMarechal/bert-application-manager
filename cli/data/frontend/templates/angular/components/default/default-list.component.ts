import { Component, OnInit } from '@angular/core';
import * as <capitalized_camel_cased_name>Actions from '@app/store/actions/<name_with_dashes>.actions
import * as from<capitalized_camel_cased_name> from '@app/store/reducers/<name_with_dashes>.reducers';
import {Observable} from 'rxjs';
import {Store} from '@ngrx/store';


@Component({
  selector: 'app-<name_with_dashes>',
  templateUrl: './<name_with_dashes>.component.html',
  styleUrls: ['./<name_with_dashes>.component.scss']
})
export class <capitalized_camel_cased_name>Component implements OnInit {
    <camel_cased_name>$: Observable<from<capitalized_camel_cased_name>.State>;

    constructor(
        private <camel_cased_name>Store: Store<from<capitalized_camel_cased_name>.FeatureState>
    ) { }

    ngOnInit() {
        this.<camel_cased_name>$ = this.<camel_cased_name>Store.select('<camel_cased_name>');
    }
    onList(event: DatabasePaginationInput) {
        this.store.dispatch(new <capitalized_camel_cased_name>Actions.PageList<capitalized_camel_cased_name>Action(event));
    }
}
