export type DatabaseFileType =
    | 'table'
    | 'function'
    | 'index'
    | 'type'
    | 'data'
    | 'sequence'
    | 'trigger'
    | 'view'
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
    table: { [name: string]: DatabaseSubObject; };
    type: { [name: string]: DatabaseSubObject; };
    function: { [name: string]: DatabaseSubObject; };
    data: { [name: string]: DatabaseSubObject; };
    sequence: { [name: string]: DatabaseSubObject; };
    index: { [name: string]: DatabaseSubObject; };
    view: { [name: string]: DatabaseSubObject; };
    trigger: { [name: string]: DatabaseSubObject; };
    _parameters: {
        dbName: string;
        hasCurrent: boolean;
    };

    constructor() {
        this.table = {};
        this.type = {};
        this.function = {};
        this.data = {};
        this.sequence = {};
        this.index = {};
        this.view = {};
        this.trigger = {};
        this._parameters = {
            dbName: '',
            hasCurrent: false
        };
    }
}

export class DatabaseFile {
    type: DatabaseFileType;
    fileName: string;
    objectName: string;

    constructor(repoName: string, fileName: string) {
        this.type = 'unknown';
        this.fileName = repoName + fileName;
        if (fileName.includes('03-tables')) {
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
        }
        const fileNameSplit = fileName.split('/');
        this.objectName = fileNameSplit[fileNameSplit.length - 1].split('.')[0];
    }
}
export class DatabaseVersion {
    userToUse: string;
    dependencies?: {
        application: string;
        version: string;
    };
    fileList: string[];
    files: DatabaseFile[];

    constructor(params: any, fileName: string) {
        this.userToUse = params.userToUse;
        this.dependencies = params.dependencies || [];
        this.fileList = params.fileList;
        const fileNameMinusVersion = fileName.split('/postgres/release')[0];
        this.files = this.fileList.map(file => {
            return new DatabaseFile(fileNameMinusVersion, file.replace(/\.\.\//gi, ''));
        });
    }
}
export class DatabaseVersionFile {
    fileName: string;
    versionName: string;
    versions: DatabaseVersion[];

    constructor(fileName: string, params?: any) {
        this.fileName = fileName;
        const fileNameSplit = fileName.split('/');
        this.versionName = fileNameSplit[fileNameSplit.length - 2];
        this.versions = params.map((x: any) => new DatabaseVersion(x, fileName));
    }
}