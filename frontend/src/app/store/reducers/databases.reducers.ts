import { AppState } from './app.reducers';
import * as DatabasesActions from '../actions/databases.actions';
import { DatabaseObject } from 'app/models/database-file.model';

export interface FeatureState extends AppState {
    databases: State;
}

export interface State {
    gettingDatabase: boolean;
    database: DatabaseObject;
    databaseName: string;
}

const databasesInitialState: State = {
    gettingDatabase: false,
    database: null,
    databaseName: null,
};

export function databasesReducers(
    state = databasesInitialState,
    action: DatabasesActions.DatabasesActions
) {
    switch (action.type) {
        case DatabasesActions.ROUTER_GET_DATABASE:
        case DatabasesActions.EFFECT_GET_DATABASE:
        case DatabasesActions.PAGE_GET_DATABASE:
            return {
                ...state,
                gettingDatabase: true,
                databaseName: action.payload,
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
        case DatabasesActions.SERVICE_CREATE_DATABASE_TABLE_COMPLETE:
        case DatabasesActions.SERVICE_CREATE_DATABASE_FUNCTIONS_COMPLETE:
        case DatabasesActions.SERVICE_INITIALIZE_DATABASE_COMPLETE:
        case DatabasesActions.SERVICE_ADD_TEMPLATE_COMPLETE:
        case DatabasesActions.SERVICE_REFRESH_COMPLETE:
        case DatabasesActions.SERVICE_CREATE_VERSION_COMPLETE:
            return {
                ...state,
                database: action.payload
            };
        default:
            break;
    }
    return state;
}