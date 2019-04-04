import { Action } from '@ngrx/store';
import { DatabaseTable, DatabaseTableForSave } from 'app/models/database-file.model';

export const PAGE_GET_DATABASE_TABLES = '[Database Table Page] get database tables';
export const ROUTER_GET_DATABASE_TABLES = '[Database Table Router] get database tables';
export const EFFECT_GET_DATABASE_TABLES = '[Database Table Effect] get database tables';
export const SERVICE_GET_DATABASE_TABLES_COMPLETE = '[Database Table Service] get database tables complete';
export const SERVICE_GET_DATABASE_TABLES_FAILED = '[Database Table Service] get database tables failed';

export class PageGetDatabaseTables implements Action {
    readonly type = PAGE_GET_DATABASE_TABLES;
    constructor(public payload: string) {
    }
}
export class RouterGetDatabaseTables implements Action {
    readonly type = ROUTER_GET_DATABASE_TABLES;
    constructor(public payload: string) {
    }
}
export class EffectGetDatabaseTables implements Action {
    readonly type = EFFECT_GET_DATABASE_TABLES;
    constructor(public payload: string) {
    }
}
export class ServiceGetDatabaseTablesComplete implements Action {
    readonly type = SERVICE_GET_DATABASE_TABLES_COMPLETE;
    constructor(public payload: { [name: string]: DatabaseTable }) {
    }
}
export class ServiceGetDatabaseTablesFailed implements Action {
    readonly type = SERVICE_GET_DATABASE_TABLES_FAILED;
    constructor(public payload: string) {
    }
}

export const PAGE_GET_DATABASE_TABLE = '[Database Table Page] get database table';
export const ROUTER_GET_DATABASE_TABLE = '[Database Table Router] get database table';
export const EFFECT_GET_DATABASE_TABLE = '[Database Table Effect] get database table';
export const SERVICE_GET_DATABASE_TABLE_COMPLETE = '[Database Table Service] get database table complete';
export const SERVICE_GET_DATABASE_TABLE_FAILED = '[Database Table Service] get database table failed';

export class PageGetDatabaseTable implements Action {
    readonly type = PAGE_GET_DATABASE_TABLE;
    constructor(public payload: { databaseName: string, tableName: string }) {
    }
}
export class RouterGetDatabaseTable implements Action {
    readonly type = ROUTER_GET_DATABASE_TABLE;
    constructor(public payload: { databaseName: string, tableName: string }) {
    }
}
export class EffectGetDatabaseTable implements Action {
    readonly type = EFFECT_GET_DATABASE_TABLE;
    constructor(public payload: { databaseName: string, tableName: string }) {
    }
}
export class ServiceGetDatabaseTableComplete implements Action {
    readonly type = SERVICE_GET_DATABASE_TABLE_COMPLETE;
    constructor(public payload: DatabaseTable) {
    }
}
export class ServiceGetDatabaseTableFailed implements Action {
    readonly type = SERVICE_GET_DATABASE_TABLE_FAILED;
    constructor(public payload: string) {
    }
}

export const PAGE_CREATE_DATABASE_TABLE = '[Database Table Page] create database table';
export const SERVICE_CREATE_DATABASE_TABLE_COMPLETE = '[Database Table Service] create database table complete';
export const SERVICE_CREATE_DATABASE_TABLE_FAILED = '[Database Table Service] create database table failed';

export class PageCreateDatabaseTable implements Action {
    readonly type = PAGE_CREATE_DATABASE_TABLE;
    constructor(public payload: DatabaseTableForSave) {
    }
}
export class ServiceCreateDatabaseTableComplete implements Action {
    readonly type = SERVICE_CREATE_DATABASE_TABLE_COMPLETE;
    constructor(public payload?: string) {
    }
}
export class ServiceCreateDatabaseTableFailed implements Action {
    readonly type = SERVICE_CREATE_DATABASE_TABLE_FAILED;
    constructor(public payload?: string) {
    }
}

export const PAGE_ADD_TABLE_TAG = '[Database Table Page] add table tag';
export const SERVICE_ADD_TABLE_TAG_COMPLETE = '[Database Table Service] add table tag complete';
export const SERVICE_ADD_TABLE_TAG_FAILED = '[Database Table Service] add table tag failed';

export class PageAddTableTag implements Action {
    readonly type = PAGE_ADD_TABLE_TAG;
    constructor(public payload: { tagName: string, tagValue: string }) {
    }
}
export class ServiceAddTableTagComplete implements Action {
    readonly type = SERVICE_ADD_TABLE_TAG_COMPLETE;
    constructor(public payload?: string) {
    }
}
export class ServiceAddTableTagFailed implements Action {
    readonly type = SERVICE_ADD_TABLE_TAG_FAILED;
    constructor(public payload?: string) {
    }
}
export const PAGE_REMOVE_TABLE_TAG = '[Database Table Page] remove table tag';
export const SERVICE_REMOVE_TABLE_TAG_COMPLETE = '[Database Table Service] remove table tag complete';
export const SERVICE_REMOVE_TABLE_TAG_FAILED = '[Database Table Service] remove table tag failed';

export class PageRemoveTableTag implements Action {
    readonly type = PAGE_REMOVE_TABLE_TAG;
    constructor(public payload: { tagName: string }) {
    }
}
export class ServiceRemoveTableTagComplete implements Action {
    readonly type = SERVICE_REMOVE_TABLE_TAG_COMPLETE;
    constructor(public payload?: string) {
    }
}
export class ServiceRemoveTableTagFailed implements Action {
    readonly type = SERVICE_REMOVE_TABLE_TAG_FAILED;
    constructor(public payload?: string) {
    }
}
export const PAGE_ADD_FIELD_TAG = '[Database Table Page] add field tag';
export const SERVICE_ADD_FIELD_TAG_COMPLETE = '[Database Table Service] add field tag complete';
export const SERVICE_ADD_FIELD_TAG_FAILED = '[Database Table Service] add field tag failed';

export class PageAddFieldTag implements Action {
    readonly type = PAGE_ADD_FIELD_TAG;
    constructor(public payload: { fieldName: string, tagName: string, tagValue: string }) {
    }
}
export class ServiceAddFieldTagComplete implements Action {
    readonly type = SERVICE_ADD_FIELD_TAG_COMPLETE;
    constructor(public payload?: string) {
    }
}
export class ServiceAddFieldTagFailed implements Action {
    readonly type = SERVICE_ADD_FIELD_TAG_FAILED;
    constructor(public payload?: string) {
    }
}
export const PAGE_REMOVE_FIELD_TAG = '[Database Table Page] remove field tag';
export const SERVICE_REMOVE_FIELD_TAG_COMPLETE = '[Database Table Service] remove field tag complete';
export const SERVICE_REMOVE_FIELD_TAG_FAILED = '[Database Table Service] remove field tag failed';

export class PageRemoveFieldTag implements Action {
    readonly type = PAGE_REMOVE_FIELD_TAG;
    constructor(public payload: { fieldName: string, tagName: string }) {
    }
}
export class ServiceRemoveFieldTagComplete implements Action {
    readonly type = SERVICE_REMOVE_FIELD_TAG_COMPLETE;
    constructor(public payload?: string) {
    }
}
export class ServiceRemoveFieldTagFailed implements Action {
    readonly type = SERVICE_REMOVE_FIELD_TAG_FAILED;
    constructor(public payload?: string) {
    }
}

export type DatabaseTableActions =
    | PageGetDatabaseTables
    | RouterGetDatabaseTables
    | EffectGetDatabaseTables
    | ServiceGetDatabaseTablesComplete
    | ServiceGetDatabaseTablesFailed

    | EffectGetDatabaseTable
    | PageGetDatabaseTable
    | RouterGetDatabaseTable
    | ServiceGetDatabaseTableComplete
    | ServiceGetDatabaseTableFailed

    | PageCreateDatabaseTable
    | ServiceCreateDatabaseTableComplete
    | ServiceCreateDatabaseTableFailed

    | PageAddTableTag
    | ServiceAddTableTagComplete
    | ServiceAddTableTagFailed

    | PageRemoveTableTag
    | ServiceRemoveTableTagComplete
    | ServiceRemoveTableTagFailed

    | PageAddFieldTag
    | ServiceAddFieldTagComplete
    | ServiceAddFieldTagFailed

    | PageRemoveFieldTag
    | ServiceRemoveFieldTagComplete
    | ServiceRemoveFieldTagFailed
    ;
