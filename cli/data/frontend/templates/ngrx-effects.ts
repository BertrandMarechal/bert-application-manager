import {Injectable} from '@angular/core';
import {Actions, Effect, ofType} from '@ngrx/effects';
import {from, Observable} from 'rxjs';
import {Action, select, Store} from '@ngrx/store';
import {map} from 'rxjs/operators';
import {Router} from '@angular/router';

import {RouteNavigationParams, RouterUtilsService} from '@app/shared/services/router-utils.service';
import {NgrxUtilsService} from '@app/services/ngrx-utils.service';

import {<capitalized_camel_cased_name>} from '@app/models/<name_with_dashes>.model';
import {<capitalized_camel_cased_name>Service} from '@app/services/<name_with_dashes>.service';
import * as <capitalized_camel_cased_name>Actions from '../actions/<name_with_dashes>.actions';
import * as from<capitalized_camel_cased_name> from '../reducers/<name_with_dashes>.reducers';

@Injectable()
export class <capitalized_camel_cased_name>Effects {
<effects>

  constructor(
    private actions$: Actions,
    private <camel_cased_name>Service: <capitalized_camel_cased_name>Service,
    private store: Store<from<capitalized_camel_cased_name>.FeatureState>,
    private router: Router
  ) {
  }

}
