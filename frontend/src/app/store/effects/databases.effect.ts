import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store, Action, select } from '@ngrx/store';
import { Observable } from 'rxjs';
import { NgrxUtilsService } from 'app/services/ngrx-utils';
import * as DatabasesActions from '../actions/databases.actions';
import * as fromDatabases from '../reducers/databases.reducers';
import * as fromApp from '../reducers/app.reducers';
import { RouterUtilsService, RouteNavigationParams } from 'app/services/router-utils.service';
import { map } from 'rxjs/operators';
import { DatabaseService } from 'app/services/database.service';

@Injectable()
export class DatabasesEffects {
    @Effect() navigateToDatabase: Observable<Action> = RouterUtilsService.handleNavigationWithParams(
        '/databases/:name',
        this.actions$
    ).pipe(map((result: RouteNavigationParams) => ({
        type: DatabasesActions.ROUTER_GET_DATABASE,
        payload: result.params.name
    })));

    @Effect() getDatabase: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        store: this.store.pipe(select('databases')),
        actionsToListenTo: [
            DatabasesActions.EFFECT_GET_DATABASE,
            DatabasesActions.ROUTER_GET_DATABASE,
            DatabasesActions.PAGE_GET_DATABASE,
        ],
        debounceTime: 200,
        serviceMethod: this.databasesService.getDatabase.bind(this.databasesService),
        // condition: (action: DatabasesActions.EffectGetDatabase | DatabasesActions.RouterGetDatabase | DatabasesActions.PageGetDatabase,
        //     state: fromDatabases.State) =>
        //     action.type !== DatabasesActions.ROUTER_GET_DATABASE || state.databaseName !== action.payload
    });
    @Effect() refreshDatabase: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [DatabasesActions.PAGE_REFRESH],
        store: this.store.pipe(select('databases')),
        payloadTransform: (_action: any, state: fromDatabases.State) => state.databaseName,
        serviceMethod: this.databasesService.refreshDatabase.bind(this.databasesService),
    });

    @Effect() createDatabaseTable: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.PAGE_CREATE_DATABASE_TABLE
        ],
        store: this.store.pipe(select('databases')),
        payloadTransform: (action: DatabasesActions.PageCreateDatabaseTable, state: fromDatabases.State) =>
            ({ name: state.databaseName, details: action.payload }),
        serviceMethod: this.databasesService.createDatabaseTable.bind(this.databasesService)
    });

    @Effect() createDatabaseFunctions: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.PAGE_CREATE_DATABASE_FUNCTIONS
        ],
        store: this.store.pipe(select('databases')),
        payloadTransform: (_action: any, state: fromDatabases.State) => state.databaseName,
        serviceMethod: this.databasesService.createDatabaseFunctions.bind(this.databasesService)
    });

    @Effect() initializeDatabase: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.PAGE_INITIALIZE_DATABASE
        ],
        store: this.store.pipe(select('databases')),
        payloadTransform: (_action: any, state: fromDatabases.State) => state.databaseName,
        serviceMethod: this.databasesService.initializeDatabase.bind(this.databasesService)
    });

    @Effect() installDatabase: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.PAGE_INSTALL_DATABASE
        ],
        store: this.store.pipe(select('app')),
        payloadTransform: (action: DatabasesActions.PageInstallDatabase, state: fromApp.State) => ({
            name: action.payload.name,
            version: action.payload.version,
            environment: state.environment
        }),
        serviceMethod: this.databasesService.installDatabase.bind(this.databasesService)
    });
    @Effect() addTemplate: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.PAGE_ADD_TEMPLATE
        ],
        store: this.store.pipe(select('databases')),
        payloadTransform: (action: DatabasesActions.PageAddTemplate, state: fromDatabases.State) =>
            ({ name: state.databaseName, template: action.payload }),
        serviceMethod: this.databasesService.addTemplate.bind(this.databasesService)
    });
    @Effect() createVersion: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.PAGE_CREATE_VERSION
        ],
        store: this.store.pipe(select('databases')),
        payloadTransform: (_action: any, state: fromDatabases.State) => state.databaseName,
        serviceMethod: this.databasesService.createVersion.bind(this.databasesService)
    });
    @Effect() checkParameters: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.PAGE_CHECK_PARAMETERS
        ],
        store: this.store.pipe(select('app')),
        payloadTransform: (action: DatabasesActions.PageCheckParameters, state: fromApp.State) => ({
            name: action.payload,
            environment: state.environment
        }),
        serviceMethod: this.databasesService.checkParameters.bind(this.databasesService)
    });
    @Effect() checkCode: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.PAGE_CHECK_CODE
        ],
        store: this.store.pipe(select('app')),
        payloadTransform: (action: DatabasesActions.PageCheckCode, state: fromApp.State) => ({
            name: action.payload,
            environment: state.environment
        }),
        serviceMethod: this.databasesService.checkCode.bind(this.databasesService)
    });
    constructor(
        private actions$: Actions,
        private databasesService: DatabaseService,
        private store: Store<fromDatabases.FeatureState>
    ) {
    }
}