import { AppState } from './app.reducers';
import * as DatabasesActions from '../actions/databases.actions';
import { DatabaseObject } from 'app/models/database-file.model';

export interface FeatureState extends AppState {
    databases: State;
}

export interface State {
    gettingDatabase: boolean;
    database: DatabaseObject;
}

const databasesInitialState: State = {
    gettingDatabase: false,
    database: null
};

export function databasesReducers(
    state = databasesInitialState,
    action: DatabasesActions.DatabasesActions
) {
    switch (action.type) {
        case DatabasesActions.EFFECT_GET_DATABASE:
            return {
                ...state,
                gettingDatabase: true,
            };
        case DatabasesActions.SERVICE_GET_DATABASE_COMPLETE:
            return {
                ...state,
                gettingDatabase: false,
                database: action.payload
            };
        case DatabasesActions.SERVICE_GET_DATABASE_FAILED:
            return {
                ...state,
                gettingDatabase: false
            };
        default:
            break;
    }
    return state;
}