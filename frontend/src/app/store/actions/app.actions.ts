import { Action } from '@ngrx/store';

export const PAGE_SET_ENVIORONMENT = '[Console Page] notification';

export class PageSetEnvironment implements Action {
    readonly type = PAGE_SET_ENVIORONMENT;
    constructor(public payload: string) {
    }
}

export type AppActions =
    | PageSetEnvironment
    ;
