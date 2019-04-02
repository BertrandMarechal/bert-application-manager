import { ActionReducerMap } from '@ngrx/store';
import * as AppActions from '../actions/app.actions';

export interface AppState {
    app: State;
}
export interface State {
    environment: string;
}

const appInitialState: State = {
    environment: 'local'
};


export function appReducers(
    state = appInitialState,
    action: AppActions.AppActions
) {
    switch (action.type) {
        case AppActions.PAGE_SET_ENVIORONMENT:
            return {
                ...state,
                environment: action.payload
            };
        default:
            break;
    }
    return state;
}
export const reducers: ActionReducerMap<AppState> = {
    app: null
};
