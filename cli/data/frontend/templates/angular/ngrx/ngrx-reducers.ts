import {AppState} from '@app/reducers';

import * as <capitalized_camel_cased_name>Actions from '../actions/<name_with_dashes>.actions';
import {<capitalized_camel_cased_name>} from '@app/models/<name_with_dashes>.model';

export interface FeatureState extends AppState {
  <camel_cased_name>: State;
}

export interface State {
<types>
}

const <camel_cased_name>InitialState: State = {
<initial_state>
};

export function <camel_cased_name>Reducers(
  state = <camel_cased_name>InitialState,
  action: <capitalized_camel_cased_name>Actions.<capitalized_camel_cased_name>Actions,
) {
  switch (action.type) {
<cases>
  }
  return state;
}
