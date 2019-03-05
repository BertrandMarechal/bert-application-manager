import { threadId } from "worker_threads";

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

export interface DatabaseSubObject {
    latestVersion: string;
    latestFile: string;
    versions: {
        version: string;
        file: string;
    }[];
}
export class DatabaseObject {
    setup: { [name: string]: DatabaseSubObject; };
    table: { [name: string]: DatabaseSubObject; };
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
    };
    _parameters: {
        [name: string]: string[];
    }

    constructor() {
        this.setup = {};
        this.table = {};
        this.function = {};
        this.index = {};
        this.type = {};
        this.data = {};
        this.sequence = {};
        this.trigger = {};
        this.view = {};
        this['foreign-servers'] = {};
        this['user-mappings'] = {};
        this['local-tables'] = {};
        this['foreign-tables'] = {};
        this['source-specific-app-setup'] = {};
        this['data-transfers'] = {};
        this['external-system-integrations'] = {};
        this['data-exchange'] = {};
        this['users-roles-permissions'] = {};
        this['full-text-catalogues'] = {};
        this._properties = {
            dbName: '',
            hasCurrent: false
        };
        this._parameters = {};
    }
}

export class DatabaseFile {
    type: DatabaseFileType;
    fileName: string;
    objectName: string;

    constructor(repoName: string, fileName: string) {
        this.type = 'unknown';
        this.fileName = repoName + fileName;
        if (fileName.includes('00-database-setup')) {
            this.type = 'setup'
        } else if (fileName.includes('03-tables')) {
            this.type = 'table'
        } else if (fileName.includes('0q-types')) {
            this.type = 'type'
        } else if (fileName.includes('07-functions')) {
            this.type = 'function'
        } else if (fileName.includes('09-data')) {
            this.type = 'data'
        } else if (fileName.includes('04-sequences')) {
            this.type = 'sequence'
        } else if (fileName.includes('05-indexes')) {
            this.type = 'index'
        } else if (fileName.includes('06-views')) {
            this.type = 'view'
        } else if (fileName.includes('08-triggers')) {
            this.type = 'trigger'
        } else if (fileName.includes('00-foreign-servers')) {
            this.type = 'foreign-servers';
        } else if (fileName.includes('01-user-mappings')) {
            this.type = 'user-mappings';
        } else if (fileName.includes('02-local-tables')) {
            this.type = 'local-tables';
        } else if (fileName.includes('03-foreign-tables')) {
            this.type = 'foreign-tables';
        } else if (fileName.includes('04-source-specific-app-setup')) {
            this.type = 'source-specific-app-setup';
        } else if (fileName.includes('01-data-transfers')) {
            this.type = 'data-transfers';
        } else if (fileName.includes('02-external-system-integrations')) {
            this.type = 'external-system-integrations';
        } else if (fileName.includes('03-data-exchange')) {
            this.type = 'data-exchange';
        } else if (fileName.includes('10-users-roles-permissions')) {
            this.type = 'users-roles-permissions';
        } else if (fileName.includes('11-full-text-catalogues')) {
            this.type = 'full-text-catalogues';
        }
        
        const fileNameSplit = fileName.split('\\');
        this.objectName = fileNameSplit[fileNameSplit.length - 1].split('.')[0];
    }
}
export class DatabaseVersion {
    userToUse: string;
    databaseToUse: string;
    dependencies?: {
        application: string;
        version: string;
    };
    fileList: string[];
    files: DatabaseFile[];

    constructor(params: any, fileName: string) {
        this.userToUse = params.userToUse;
        this.databaseToUse = params.databaseToUse;
        this.dependencies = params.dependencies || [];
        this.fileList = params.fileList.map((x: string) => x.replace(/\//g, '\\'));
        const fileNameMinusVersion = fileName.split('\\postgres\\release')[0];
        this.files = this.fileList.map(file => {
            return new DatabaseFile(fileNameMinusVersion, file.replace(/\.\.\\/gi, ''));
        });
    }
}
export class DatabaseVersionFile {
    fileName: string;
    versionName: string;
    versions: DatabaseVersion[];

    constructor(fileName: string, params?: any) {
        this.fileName = fileName.replace(/\//g, '\\');
        const fileNameSplit = this.fileName.split('\\');
        this.versionName = fileNameSplit[fileNameSplit.length - 2];
        this.versions = params.map((x: any) => new DatabaseVersion(x, this.fileName));
    }
}