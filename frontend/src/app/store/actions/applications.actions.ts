import { Action } from '@ngrx/store';
import { Application } from 'app/models/application.model';

export const PAGE_GET_APPLICATIONS = '[Applications Page] get applications';
export const ROUTER_GET_APPLICATIONS = '[Applications Router] get applications';
export const EFFECT_GET_APPLICATIONS = '[Applications Effect] get applications';
export const SERVICE_GET_APPLICATIONS_COMPLETE = '[Applications Service] get applications complete';
export const SERVICE_GET_APPLICATIONS_FAILED = '[Applications Service] get applications failed';

export class PageGetApplications implements Action {
    readonly type = PAGE_GET_APPLICATIONS;
}
export class RouterGetApplications implements Action {
    readonly type = ROUTER_GET_APPLICATIONS;
}
export class EffectGetApplications implements Action {
    readonly type = EFFECT_GET_APPLICATIONS;
}
export class ServiceGetApplicationsComplete implements Action {
    readonly type = SERVICE_GET_APPLICATIONS_COMPLETE;
    constructor(public payload: string[]) {
    }
}
export class ServiceGetApplicationsFailed implements Action {
    readonly type = SERVICE_GET_APPLICATIONS_FAILED;
    constructor(public payload: string) {
    }
}

export const PAGE_GET_APPLICATION = '[Application Page] get application';
export const ROUTER_GET_APPLICATION = '[Application Router] get application';
export const EFFECT_GET_APPLICATION = '[Application Effect] get application';
export const SERVICE_GET_APPLICATION_COMPLETE = '[Application Service] get application complete';
export const SERVICE_GET_APPLICATION_FAILED = '[Application Service] get application failed';

export class PageGetApplication implements Action {
    readonly type = PAGE_GET_APPLICATION;
    constructor(public payload: string) {
    }
}
export class RouterGetApplication implements Action {
    readonly type = ROUTER_GET_APPLICATION;
    constructor(public payload: string) {
    }
}
export class EffectGetApplication implements Action {
    readonly type = EFFECT_GET_APPLICATION;
    constructor(public payload: string) {
    }
}
export class ServiceGetApplicationComplete implements Action {
    readonly type = SERVICE_GET_APPLICATION_COMPLETE;
    constructor(public payload: Application) {
    }
}
export class ServiceGetApplicationFailed implements Action {
    readonly type = SERVICE_GET_APPLICATION_FAILED;
    constructor(public payload: string) {
    }
}

export type ApplicationsActions =
    | EffectGetApplications
    | PageGetApplications
    | RouterGetApplications
    | ServiceGetApplicationsComplete
    | ServiceGetApplicationsFailed

    | EffectGetApplication
    | PageGetApplication
    | RouterGetApplication
    | ServiceGetApplicationComplete
    | ServiceGetApplicationFailed
    ;
