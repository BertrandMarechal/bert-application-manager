import { DatabaseTable } from 'app/models/database-file.model';
import * as DatabaseTableActions from '../actions/database-table.actions';
import { AppState } from './app.reducers';

export interface FeatureState extends AppState {
    databaseTable: State;
}

export interface State {
    gettingDatabaseTables: boolean;
    databaseTables: { [name: string]: DatabaseTable };
    gettingDatabaseTable: boolean;
    databaseTable: DatabaseTable;
    databaseName: string;
}

const databaseTableInitialState: State = {
    gettingDatabaseTables: false,
    databaseTables: {},
    gettingDatabaseTable: false,
    databaseTable: null,
    databaseName: null,
};

export function databaseTableReducers(
    state = databaseTableInitialState,
    action: DatabaseTableActions.DatabaseTableActions
) {
    switch (action.type) {
        case DatabaseTableActions.ROUTER_GET_DATABASE_TABLES:
        case DatabaseTableActions.EFFECT_GET_DATABASE_TABLES:
        case DatabaseTableActions.PAGE_GET_DATABASE_TABLES:
            return {
                ...state,
                gettingDatabaseTables: true,
                databaseName: action.payload,
            };
        case DatabaseTableActions.SERVICE_GET_DATABASE_TABLES_COMPLETE:
            return {
                ...state,
                gettingDatabaseTables: false,
                databaseTables: action.payload
            };
        case DatabaseTableActions.SERVICE_GET_DATABASE_TABLES_FAILED:
            return {
                ...state,
                gettingDatabaseTables: false
            };
        case DatabaseTableActions.ROUTER_GET_DATABASE_TABLE:
        case DatabaseTableActions.EFFECT_GET_DATABASE_TABLE:
        case DatabaseTableActions.PAGE_GET_DATABASE_TABLE:
            return {
                ...state,
                gettingDatabaseTable: true,
                databaseName: action.payload,
            };
        case DatabaseTableActions.SERVICE_GET_DATABASE_TABLE_COMPLETE:
            return {
                ...state,
                gettingDatabaseTable: false,
                databaseTable: action.payload
            };
        case DatabaseTableActions.SERVICE_GET_DATABASE_TABLE_FAILED:
            return {
                ...state,
                gettingDatabaseTable: false
            };
        case DatabaseTableActions.SERVICE_CREATE_DATABASE_TABLE_COMPLETE:
            return {
                ...state,
                databaseTable: action.payload
            };
        default:
            break;
    }
    return state;
}
