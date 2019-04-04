import { Injectable } from '@angular/core';
import { DatabaseTableService } from '@app/services/database-table.service';
import { Actions, Effect } from '@ngrx/effects';
import { Action, select, Store } from '@ngrx/store';
import { NgrxUtilsService } from 'app/services/ngrx-utils';
import { RouteNavigationParams, RouterUtilsService } from 'app/services/router-utils.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as DatabaseTableActions from '../actions/database-table.actions';
import * as DatabasesActions from '../actions/databases.actions';
import * as fromDatabases from '../reducers/databases.reducers';
import * as fromDatabaseTable from '../reducers/database-table.reducers';

@Injectable()
export class DatabaseTableEffects {
    @Effect() navigateToDatabaseTables: Observable<Action> = RouterUtilsService.handleNavigationWithParams({
        urls: ['/databases/:name/tables'],
        actionsObs: this.actions$
    }).pipe(map((result: RouteNavigationParams) => {
        return {
            type: DatabaseTableActions.ROUTER_GET_DATABASE_TABLES,
            payload: result.params.name
        };
    }
    ));
    @Effect() navigateToDatabaseTable: Observable<Action> = RouterUtilsService.handleNavigationWithParams({
        urls: ['/databases/:name/tables/:tableName/:version'],
        actionsObs: this.actions$
    }).pipe(map((result: RouteNavigationParams) => ({
        type: DatabaseTableActions.ROUTER_GET_DATABASE_TABLE,
        payload: { databaseName: result.params.name, tableName: result.params.tableName, version: result.params.version }
    })));

    @Effect() getDatabaseTables: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        store: this.store.pipe(select('databaseTable')),
        actionsToListenTo: [
            DatabaseTableActions.EFFECT_GET_DATABASE_TABLES,
            DatabaseTableActions.ROUTER_GET_DATABASE_TABLES,
            DatabaseTableActions.PAGE_GET_DATABASE_TABLES,
        ],
        serviceMethod: this.databaseTableService.getDatabaseTables.bind(this.databaseTableService)
    });
    @Effect() getDatabaseTable: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        store: this.store.pipe(select('databaseTable')),
        actionsToListenTo: [
            DatabaseTableActions.EFFECT_GET_DATABASE_TABLE,
            DatabaseTableActions.ROUTER_GET_DATABASE_TABLE,
            DatabaseTableActions.PAGE_GET_DATABASE_TABLE,
        ],
        condition: (action: DatabaseTableActions.PageGetDatabaseTable |
            DatabaseTableActions.EffectGetDatabaseTable |
            DatabaseTableActions.RouterGetDatabaseTable) => action.payload.tableName !== 'new',
        serviceMethod: this.databaseTableService.getDatabaseTable.bind(this.databaseTableService)
    });

    @Effect() createDatabaseTable: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.PAGE_CREATE_DATABASE_TABLE
        ],
        store: this.store.pipe(select('databaseTable')),
        payloadTransform: (action: DatabasesActions.PageCreateDatabaseTable, state: fromDatabases.State) =>
            ({ name: state.databaseName, details: action.payload }),
        serviceMethod: this.databaseTableService.createDatabaseTable.bind(this.databaseTableService)
    });

    @Effect() addTableTag: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        store: this.store.pipe(select('databaseTable')),
        actionsToListenTo: [
            DatabaseTableActions.PAGE_ADD_TABLE_TAG,
        ],
        condition: (action: DatabaseTableActions.PageAddTableTag, state: fromDatabaseTable.State) => !!state.databaseTable.name,
        payloadTransform: (action: DatabaseTableActions.PageAddTableTag, state: fromDatabaseTable.State) => ({
            name: state.databaseName,
            tableName: state.databaseTable.name,
            tagName: action.payload.tagName,
            tagValue: action.payload.tagValue
        }),
        serviceMethod: this.databaseTableService.addTableTag.bind(this.databaseTableService)
    });

    @Effect() removeTableTag: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        store: this.store.pipe(select('databaseTable')),
        actionsToListenTo: [
            DatabaseTableActions.PAGE_REMOVE_TABLE_TAG,
        ],
        condition: (action: DatabaseTableActions.PageRemoveTableTag, state: fromDatabaseTable.State) => !!state.databaseTable.name,
        payloadTransform: (action: DatabaseTableActions.PageRemoveTableTag, state: fromDatabaseTable.State) => ({
            name: state.databaseName,
            tableName: state.databaseTable.name,
            tagName: action.payload.tagName
        }),
        serviceMethod: this.databaseTableService.removeTableTag.bind(this.databaseTableService)
    });

    @Effect() addFieldTag: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        store: this.store.pipe(select('databaseTable')),
        actionsToListenTo: [
            DatabaseTableActions.PAGE_ADD_FIELD_TAG,
        ],
        condition: (action: DatabaseTableActions.PageAddFieldTag, state: fromDatabaseTable.State) => !!state.databaseTable.name,
        payloadTransform: (action: DatabaseTableActions.PageAddFieldTag, state: fromDatabaseTable.State) => ({
            name: state.databaseName,
            tableName: state.databaseTable.name,
            fieldName: action.payload.fieldName,
            tagName: action.payload.tagName,
            tagValue: action.payload.tagValue
        }),
        serviceMethod: this.databaseTableService.addFieldTag.bind(this.databaseTableService)
    });

    @Effect() removeFieldTag: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        store: this.store.pipe(select('databaseTable')),
        actionsToListenTo: [
            DatabaseTableActions.PAGE_REMOVE_FIELD_TAG,
        ],
        condition: (action: DatabaseTableActions.PageRemoveFieldTag, state: fromDatabaseTable.State) => !!state.databaseTable.name,
        payloadTransform: (action: DatabaseTableActions.PageRemoveFieldTag, state: fromDatabaseTable.State) => ({
            name: state.databaseName,
            tableName: state.databaseTable.name,
            fieldName: action.payload.fieldName,
            tagName: action.payload.tagName
        }),
        serviceMethod: this.databaseTableService.removeFieldTag.bind(this.databaseTableService)
    });

    @Effect() refreshPostTag: Observable<Action> = NgrxUtilsService.actionToAction({
        actionsObs: this.actions$,
        store: this.store.pipe(select('databaseTable')),
        actionsToListenTo: [
            DatabaseTableActions.SERVICE_ADD_FIELD_TAG_COMPLETE,
            DatabaseTableActions.SERVICE_ADD_TABLE_TAG_COMPLETE,
            DatabaseTableActions.SERVICE_REMOVE_FIELD_TAG_COMPLETE,
            DatabaseTableActions.SERVICE_REMOVE_TABLE_TAG_COMPLETE,
        ],
        actionToDispatch: DatabaseTableActions.EFFECT_GET_DATABASE_TABLE,
        payloadTransform: (_action, state: fromDatabaseTable.State) => ({
            databaseName: state.databaseName,
            tableName: state.databaseTable.name,
        })
    });

    constructor(
        private actions$: Actions,
        private databaseTableService: DatabaseTableService,
        private store: Store<fromDatabases.FeatureState>
    ) {
    }
}