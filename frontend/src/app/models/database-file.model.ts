export type DatabaseFileType =
    | 'setup'
    | 'table'
    | 'function'
    | 'index'
    | 'type'
    | 'data'
    | 'sequence'
    | 'trigger'
    | 'view'
    | 'foreign-servers'
    | 'user-mappings'
    | 'local-tables'
    | 'foreign-tables'
    | 'source-specific-app-setup'
    | 'data-transfers'
    | 'external-system-integrations'
    | 'data-exchange'
    | 'users-roles-permissions'
    | 'full-text-catalogues'
    | 'unknown';

const TableConstraintsFirstWord = [
    'check',
    'unique',
    'primary',
    'exclude',
    'foreign'
];

export class Tag {
    name: any;
    value: any;
}

export interface DatabaseTableForSave {
    name: string;
    tags?: Tag[];
    fields: {
        name: string;
        type: string;
        default?: string;
        unique?: boolean;
        notNull?: boolean;
        isForeignKey?: boolean;
        isPrimaryKey?: boolean;
        foreignKey?: {
            table: String;
            key: String;
        };
        tags?: { [name: string]: Tag };
    }[];
}

export class DatabaseSubObject {
    name: string;
    latestVersion: string;
    latestFile: string;
    camelCasedName: string;
    versions: {
        version: string;
        file: string;
    }[];
}

export class DatabaseTableField {
    name: string;
    camelCasedName?: string;
    type: string;
    notNull: boolean;
    toUpdate?: boolean;
    tags?: { [name: string]: Tag };
    isForeignKey: boolean;
    foreignKey?: {
        table: String;
        key: String;
    };
    isPrimaryKey: boolean;
    retrieveInList?: boolean;
    isListFilter?: boolean;
    listFilterName?: string;
    sort?: boolean;
    default: boolean;
    defaultValue?: string;
    unique: boolean;
}


export class DatabaseFunction extends DatabaseSubObject {
    dbPrefix: string;
    mode: string;
    arguments: {
        mode: string,
        name: string,
        type: string,
        defaultValue: string
    }[];
    returnType: string;
    returnTable?: {name: string, type: string}[];
    hasOrReplace: boolean;
}
export class DatabaseTable extends DatabaseSubObject {
    fields: {
        [name: string]: DatabaseTableField;
    };
    tableSuffix: string;
    dbPrefix: string;
    tags: { [name: string]: Tag };
    primaryKey?: DatabaseTableField;
}
export class DatabaseObject {
    table: { [name: string]: DatabaseTable; };
    setup: { [name: string]: DatabaseSubObject; };
    function: { [name: string]: DatabaseSubObject; };
    index: { [name: string]: DatabaseSubObject; };
    type: { [name: string]: DatabaseSubObject; };
    data: { [name: string]: DatabaseSubObject; };
    sequence: { [name: string]: DatabaseSubObject; };
    trigger: { [name: string]: DatabaseSubObject; };
    view: { [name: string]: DatabaseSubObject; };
    'foreign-servers': { [name: string]: DatabaseSubObject; };
    'user-mappings': { [name: string]: DatabaseSubObject; };
    'local-tables': { [name: string]: DatabaseSubObject; };
    'foreign-tables': { [name: string]: DatabaseSubObject; };
    'source-specific-app-setup': { [name: string]: DatabaseSubObject; };
    'data-transfers': { [name: string]: DatabaseSubObject; };
    'external-system-integrations': { [name: string]: DatabaseSubObject; };
    'data-exchange': { [name: string]: DatabaseSubObject; };
    'users-roles-permissions': { [name: string]: DatabaseSubObject; };
    'full-text-catalogues': { [name: string]: DatabaseSubObject; };
    _properties: {
        dbName: string;
        hasCurrent: boolean;
        path: string;
        lastVersion: string;
    };
    _parameters: {
        [name: string]: string[];
    };
    _versions: string[];
}

export class DatabaseFile {
    type: DatabaseFileType;
    fileName: string;
    objectName: string;
}
export interface DatabaseVersion {
    userToUse: string;
    databaseToUse: string;
    dependencies?: {
        application: string;
        version: string;
    };
    fileList: string[];
    files: DatabaseFile[];
}
export interface DatabaseVersionFile {
    fileName: string;
    versionName: string;
    versions: DatabaseVersion[];
}
