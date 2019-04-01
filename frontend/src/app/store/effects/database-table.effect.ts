import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { NgrxUtilsService } from 'app/services/ngrx-utils';
import * as DatabasesActions from '../actions/databases.actions';
import * as DatabaseTableActions from '../actions/database-table.actions';
import * as fromDatabases from '../reducers/databases.reducers';
import { RouterUtilsService, RouteNavigationParams } from 'app/services/router-utils.service';
import { map } from 'rxjs/operators';
import { DatabaseService } from 'app/services/database.service';
import { DatabaseTableService } from '@app/services/database-table.service';

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

    constructor(
        private actions$: Actions,
        private databaseTableService: DatabaseTableService,
        private store: Store<fromDatabases.FeatureState>
    ) {
    }
}