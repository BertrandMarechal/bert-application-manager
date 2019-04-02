import { Action } from '@ngrx/store';
import { LoggingParams, LoggerType } from '@app/services/localhost.service';

export const SERVICE_NOTIFICATION = '[Console Service] notification';
export const SERVICE_START_PROGRESS = '[Console Service] start progress';
export const SERVICE_PROGRESS = '[Console Service] progress';
export const SERVICE_STOP_PROGRESS = '[Console Service] stop progress';

export class ServiceNotification implements Action {
    readonly type = SERVICE_NOTIFICATION;
    constructor(public payload: {type: LoggerType, params: LoggingParams}) {
    }
}
export class ServiceStartProgress implements Action {
    readonly type = SERVICE_START_PROGRESS;
    constructor(public payload: {length: number; current: number; title: string}) {
    }
}
export class ServiceProgress implements Action {
    readonly type = SERVICE_PROGRESS;
    constructor(public payload: number) {
    }
}
export class ServiceStopProgress implements Action {
    readonly type = SERVICE_STOP_PROGRESS;
    constructor(public payload?: string) {
    }
}

export type ConsoleActions =
    | ServiceNotification
    | ServiceStartProgress
    | ServiceProgress
    | ServiceStopProgress
    ;
