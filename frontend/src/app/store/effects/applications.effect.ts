import { Injectable } from '@angular/core';
import { Effect, Actions } from '@ngrx/effects';
import { Store, Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { NgrxUtilsService } from 'app/services/ngrx-utils';
import * as ApplicationsActions from '../actions/applications.actions';
import { ApplicationsService } from 'app/services/applications.service';
import { RouterUtilsService, RouteNavigationParams } from 'app/services/router-utils.service';
import { map } from 'rxjs/operators';

@Injectable()
export class ApplicationsEffects {
    @Effect() navigateToApplications: Observable<Action> = RouterUtilsService.handleNavigationWithParams({
        urls: ['/applications'],
        actionsObs: this.actions$
    }).pipe(map(() => ({type: ApplicationsActions.ROUTER_GET_APPLICATIONS})));

    @Effect() navigateToApplication: Observable<Action> = RouterUtilsService.handleNavigationWithParams({
        urls: ['/applications/:name'],
        actionsObs: this.actions$
    }).pipe(map((result: RouteNavigationParams) => ({type: ApplicationsActions.ROUTER_GET_APPLICATION, payload: result.params.name})));

    @Effect() getApplications: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            ApplicationsActions.EFFECT_GET_APPLICATIONS,
            ApplicationsActions.ROUTER_GET_APPLICATIONS,
            ApplicationsActions.PAGE_GET_APPLICATIONS
        ],
        serviceMethod: this.applicationService.getApplications.bind(this.applicationService)
    });

    @Effect() getApplication: Observable<Action> = NgrxUtilsService.actionToServiceToAction({
        actionsObs: this.actions$,
        actionsToListenTo: [
            ApplicationsActions.EFFECT_GET_APPLICATION,
            ApplicationsActions.ROUTER_GET_APPLICATION,
            ApplicationsActions.PAGE_GET_APPLICATION
        ],
        serviceMethod: this.applicationService.getApplication.bind(this.applicationService)
    });
    constructor(
        private actions$: Actions,
        private applicationService: ApplicationsService
        ) {

    }
}