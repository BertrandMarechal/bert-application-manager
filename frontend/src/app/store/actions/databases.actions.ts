import { Action } from '@ngrx/store';
import { DatabaseObject } from 'app/models/database-file.model';

export const PAGE_GET_DATABASE = '[Application Page] get database';
export const ROUTER_GET_DATABASE = '[Application Router] get database';
export const EFFECT_GET_DATABASE = '[Application Effect] get database';
export const SERVICE_GET_DATABASE_COMPLETE = '[Application Service] get database complete';
export const SERVICE_GET_DATABASE_FAILED = '[Application Service] get database failed';

export class PageGetDatabase implements Action {
    readonly type = PAGE_GET_DATABASE;
    constructor(public payload: string) {
    }
}
export class RouterGetDatabase implements Action {
    readonly type = ROUTER_GET_DATABASE;
    constructor(public payload: string) {
    }
}
export class EffectGetDatabase implements Action {
    readonly type = EFFECT_GET_DATABASE;
    constructor(public payload: string) {
    }
}
export class ServiceGetDatabaseComplete implements Action {
    readonly type = SERVICE_GET_DATABASE_COMPLETE;
    constructor(public payload: DatabaseObject) {
    }
}
export class ServiceGetDatabaseFailed implements Action {
    readonly type = SERVICE_GET_DATABASE_FAILED;
    constructor(public payload: string) {
    }
}

export type DatabasesActions =
    | EffectGetDatabase
    | PageGetDatabase
    | RouterGetDatabase
    | ServiceGetDatabaseComplete
    | ServiceGetDatabaseFailed
    ;
