import { Action } from '@ngrx/store';
import { DatabaseObject } from 'app/models/database-file.model';

export const PAGE_GET_DATABASE = '[Databases Page] get database';
export const ROUTER_GET_DATABASE = '[Databases Router] get database';
export const EFFECT_GET_DATABASE = '[Databases Effect] get database';
export const SERVICE_GET_DATABASE_COMPLETE = '[Databases Service] get database complete';
export const SERVICE_GET_DATABASE_FAILED = '[Databases Service] get database failed';

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

export const PAGE_CREATE_DATABASE_TABLE = '[Databases Page] create database table';
export const SERVICE_CREATE_DATABASE_TABLE_COMPLETE = '[Databases Service] create database table complete';
export const SERVICE_CREATE_DATABASE_TABLE_FAILED = '[Databases Service] create database table failed';

export class PageCreateDatabaseTable implements Action {
    readonly type = PAGE_CREATE_DATABASE_TABLE;
    constructor(public payload?: string) {
    }
}
export class ServiceCreateDatabaseTableComplete implements Action {
    readonly type = SERVICE_CREATE_DATABASE_TABLE_COMPLETE;
    constructor(public payload: DatabaseObject) {
    }
}
export class ServiceCreateDatabaseTableFailed implements Action {
    readonly type = SERVICE_CREATE_DATABASE_TABLE_FAILED;
    constructor(public payload?: string) {
    }
}
export const PAGE_CREATE_DATABASE_FUNCTIONS = '[Databases Page] create database functions';
export const SERVICE_CREATE_DATABASE_FUNCTIONS_COMPLETE = '[Databases Service] create database functions complete';
export const SERVICE_CREATE_DATABASE_FUNCTIONS_FAILED = '[Databases Service] create database functions failed';

export class PageCreateDatabaseFunctions implements Action {
    readonly type = PAGE_CREATE_DATABASE_FUNCTIONS;
    constructor(public payload?: string) {
    }
}
export class ServiceCreateDatabaseFunctionsComplete implements Action {
    readonly type = SERVICE_CREATE_DATABASE_FUNCTIONS_COMPLETE;
    constructor(public payload: DatabaseObject) {
    }
}
export class ServiceCreateDatabaseFunctionsFailed implements Action {
    readonly type = SERVICE_CREATE_DATABASE_FUNCTIONS_FAILED;
    constructor(public payload?: string) {
    }
}

export type DatabasesActions =
    | EffectGetDatabase
    | PageGetDatabase
    | RouterGetDatabase
    | ServiceGetDatabaseComplete
    | ServiceGetDatabaseFailed

    | PageCreateDatabaseTable
    | ServiceCreateDatabaseTableComplete
    | ServiceCreateDatabaseTableFailed

    | PageCreateDatabaseFunctions
    | ServiceCreateDatabaseFunctionsComplete
    | ServiceCreateDatabaseFunctionsFailed
    ;
