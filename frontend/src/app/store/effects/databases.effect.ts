import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { NgrxUtilsService } from 'app/services/ngrx-utils';
import * as DatabasesActions from '../actions/databases.actions';
import { RouterUtilsService, RouteNavigationParams } from 'app/services/router-utils.service';
import { map } from 'rxjs/operators';
import { DatabaseService } from 'app/services/database.service';

@Injectable()
export class DatabasesEffects {
    @Effect() navigateToDatabase: Observable<Action> = RouterUtilsService.handleNavigationWithParams({
        urls: ['/databases/:name'],
        actionsObs: this.actions$
    }).pipe(map((result: RouteNavigationParams) => ({type: DatabasesActions.ROUTER_GET_DATABASE, payload: result.params.name})));

    @Effect() getDatabase: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            DatabasesActions.EFFECT_GET_DATABASE,
            DatabasesActions.ROUTER_GET_DATABASE,
            DatabasesActions.PAGE_GET_DATABASE
        ],
        serviceMethod: this.databasesService.getDatabase.bind(this.databasesService)
    });
    constructor(
        private actions$: Actions,
        private databasesService: DatabaseService
        ) {
    }
}