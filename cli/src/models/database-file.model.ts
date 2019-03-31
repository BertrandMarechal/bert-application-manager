import { threadId } from "worker_threads";
import { inherits } from "util";
import { FileUtils } from "../utils/file.utils";
import { SyntaxUtils } from "../utils/syntax.utils";
import { UiUtils } from "../utils/ui.utils";

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

    constructor(tag: string) {
        const regexedTag = /#([a-z-]+)(=([\[|\(]?[a-zA-Z0-9-_' ,]+[\]|\)]?))?/gi.exec(tag);
        if (regexedTag) {
            this.name = regexedTag[1];
            this.value = regexedTag[2] ? regexedTag[2].substr(1) : true;
        }
    }
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
    camelCasedName?: string;
    versions: {
        version: string;
        file: string;
    }[];

    constructor(params?: any) {
        params = params || {};
        this.name = params.name || '';
        this.latestVersion = params.latestVersion;
        this.latestFile = params.latestFile || '';
        this.versions = params.versions || [];
    }
    async analyzeFile(uiUtils: UiUtils) {}
}

export class DatabaseTableField {
    name: string;
    camelCasedName: string;
    type: string;
    notNull: boolean;
    toUpdate: boolean;
    tags: { [name: string]: Tag };
    isForeignKey: boolean;
    foreignKey?: {
        table: String;
        key: String;
    };
    isPrimaryKey: boolean;
    retrieveInList: boolean;
    isListFilter: boolean;
    listFilterName: string;
    sort: boolean;
    default: boolean;
    unique: boolean;
    defaultValue: string;

    constructor(field: {
        fullText: string;
        split: string[];
    }, tableSuffix: string) {
        this.name = field.split[0];
        this.camelCasedName = '';
        this.type = field.split[1];
        this.notNull = field.fullText.indexOf('not null') > -1;
        this.tags = (field.fullText.match(/#[a-z-]+(=[\[|\(]?[a-zA-Z0-9-_' ,]+[\]|\)]?)?/gi) || [])
            .reduce((agg, current) => {
                const tag = new Tag(current);
                return {
                    ...agg,
                    [tag.name]: tag
                }
            }, {});
        this.isForeignKey = false;
        this.isPrimaryKey = false;
        this.unique = false;
        this.retrieveInList = false;
        this.isListFilter = false;
        this.listFilterName = '';
        this.toUpdate = true;
        this.sort = false;
        this.default = false;
        this.defaultValue = '';

        const reference = /references (.*?)\((.*?)\)/i.exec(field.fullText);
        if (reference) {
            this.isForeignKey = true;
            this.foreignKey = {
                table: reference[1],
                key: reference[2]
            };
        }
        const unique = / unique[^a-z]/i.exec(field.fullText);
        if (unique) {
            this.unique = true;
        }
        const def = /default (.*)/i.exec(field.fullText);
        if (def) {
            
            this.default = true;
            this.defaultValue = def[1];
        }

        const primaryKey = /primary key/i.test(field.fullText);
        if (primaryKey) {
            this.isPrimaryKey = true;
            this.toUpdate = false;
            this.retrieveInList = true;
        }

        if (this.name === 'modified_at' ||
            this.name === 'modified_by' ||
            this.name === 'created_by' ||
            this.name === 'created_at') {
            this.toUpdate = false;
        }

        // get camel cased name
        if (this.tags['camel-cased-name'] && this.tags['camel-cased-name'].value) {
            this.camelCasedName = this.tags['camel-cased-name'].value
        } else {
            if (this.isForeignKey) {
                if (this.name.match(/fk_[a-z0-9]{3}_[a-z0-9]{3}_/i)) {
                    this.camelCasedName = SyntaxUtils
                        .snakeCaseToCamelCase(this.name.substr(11));
                }
            } else if (this.isPrimaryKey) {
                if (this.name.match(/pk_[a-z0-9]{3}_id/gi)) {
                    this.camelCasedName = 'id';
                }
            }
            if (!this.camelCasedName) {
                const fieldName = tableSuffix ? this.name.replace(tableSuffix + '_', '') : this.name;
                this.camelCasedName = SyntaxUtils
                    .snakeCaseToCamelCase(fieldName);
            }
        }

        if (this.tags['list-filter']) {
            this.isListFilter = true;
            if (this.tags['list-filter'].value && this.tags['list-filter'].value !== true) {
                this.listFilterName = this.tags['list-filter'].value;
            } else {
                this.listFilterName = this.camelCasedName;
            }
        }
        if (this.tags.sort) {
            this.sort = true;
        }
    }
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
    constructor(params?: any) {
        super(params);
        this.hasOrReplace = false;
        this.dbPrefix = '';
        this.mode = '';
        this.returnType = '';
        this.arguments = [];
    }

    async analyzeFile(uiUtils: UiUtils) {
        let functionFile = '';
        try {
            functionFile = await FileUtils.readFile(this.latestFile);
        } catch (error) {
            uiUtils.warning({message: `File ${this.latestFile} does not exist`, origin: 'DatabaseTable'});
            return;
        }
        functionFile = SyntaxUtils.simplifyDbFileForAnalysis(functionFile);
        const functionMatch = /create(?: or replace)? function (\"?public\"?\.)?\"?([a-z0-9_]+)\"? \(/i.exec(functionFile);
        if (functionMatch) {
            this.name = functionMatch[2];
            if (this.name.match(/[a-z0-9]{2,3}f_[a-z0-9_]+/i)) {
                const [dbPrefix, tableName] =
                    /([a-z0-9]{2,3})f_([a-z0-9_]+)/i.exec(this.name) || ['', ''];
                this.dbPrefix = dbPrefix;
                this.camelCasedName = SyntaxUtils.snakeCaseToCamelCase(tableName);
            }
        }

        const modeMatch = /immutable|stable|volatile|(?:not )?leakproof/i.exec(functionFile);
        if (modeMatch) {
            this.mode = modeMatch[0].toLowerCase();
        }
        
        const paramsMatch = /create(?: or replace)? function (?:\"?public\"?\.)?\"?[a-z0-9_]+\"? \(([^()]+)\)/i.exec(functionFile);
        if (paramsMatch) {
            this.arguments = paramsMatch[1].trim()
                .split(',')
                .map(param => {
                    const paramSplit = param.toLowerCase().trim().split(' ');
                    const paramToReturn = {
                        mode: '',
                        name: '',
                        type: '',
                        defaultValue: ''
                    };
                    if (/in|out|inout|variadic/i.test(paramSplit[0])) {
                        paramToReturn.mode = paramSplit[0].toLowerCase();
                        paramSplit.splice(0,1);
                    }
                    paramToReturn.name = paramSplit[0];
                    paramSplit.splice(0,1);
                    const defaultIndex = paramSplit.indexOf('default');
                    
                    if (defaultIndex > -1) {
                        paramToReturn.defaultValue =  paramSplit.splice(defaultIndex + 1, paramSplit.length - 1).join(' ');
                        paramSplit.splice(defaultIndex, 1)
                    }
                    paramToReturn.type = paramSplit.join(' ');
                    return paramToReturn;
                });
        }

        if (/create or replace function (?:\"?public\"?\.)?\"?[a-z0-9_]+\"? \(([^()]+)\)/i.test(functionFile)) {
            this.hasOrReplace = true;
        }
        const returnTableMatch = /returns table ?\(([^()]+)\)/i.exec(functionFile);
        const returnSetOfMatch = /returns setof ([a-z0-9_])/i.exec(functionFile);
        const returnSingleMatch = /returns ([a-z0-9_()])/i.exec(functionFile);
        if (returnTableMatch) {
            this.returnType = 'table';
            this.returnTable = returnTableMatch[1].trim()
                .split(',')
                .map(param => {
                    const paramSplit = param.trim().split(' ');
                    const paramToReturn = {
                        name: paramSplit[0].replace(/"/g, ''),
                        type: ''
                    };
                    paramSplit.splice(0,1);
                    paramToReturn.type = paramSplit.join(' ').toLowerCase();
                    return paramToReturn;
                });
            console.log(returnTableMatch[1]);
            
        } else if (returnSetOfMatch) {
            this.returnType = `setof ${returnSetOfMatch[1].toLowerCase()}`;
        } else if (returnSingleMatch) {
            this.returnType = returnSingleMatch[1].toLowerCase();
        } else {
            this.returnType = 'void';
        }
        console.log(this);
        
    }
}

export class DatabaseTable extends DatabaseSubObject {
    fields: {
        [name: string]: DatabaseTableField;
    };
    tableSuffix: string;
    dbPrefix: string;
    camelCasedName: string;
    tags: { [name: string]: Tag };
    primaryKey?: DatabaseTableField;
    constructor(params?: any) {
        super(params);
        this.fields = (params || {}).fields || {};
        this.tableSuffix = '';
        this.dbPrefix = '';
        this.camelCasedName = '';
        this.tags = {};
    }

    async analyzeFile(uiUtils: UiUtils) {
        let tableFile = '';
        try {
            tableFile = await FileUtils.readFile(this.latestFile);
        } catch (error) {
            uiUtils.warning({message: `File ${this.latestFile} does not exist`, origin: 'DatabaseTable'});
            return;
        }
        tableFile = SyntaxUtils.simplifyDbFileForAnalysis(tableFile);

        const tableNameMatch = /[table|exists] (\"?public\"?\.)?\"?([a-z0-9_]+)\"? \(/i.exec(tableFile);
        if (tableNameMatch) {
            this.name = tableNameMatch[2];
            if (this.name.match(/[a-z0-9]{2,3}t_[a-z0-9_]+_[a-z0-9]{3}/i)) {
                const [, dbPrefix, tableName, tableSuffix] =
                    /([a-z0-9]{2,3})t_([a-z0-9_]+)_([a-z0-9]{3})/i.exec(this.name) || ['', '', '', ''];
                this.dbPrefix = dbPrefix;
                this.camelCasedName = SyntaxUtils.snakeCaseToCamelCase(tableName);
                this.tableSuffix = tableSuffix;
            }
        }
        const stringBeforeCreate = tableFile.substr(0, tableFile.indexOf('create'));
        this.tags = (stringBeforeCreate.match(/#[a-z-]+(=[\[|\(]?[a-zA-Z0-9-_' ,]+[\]|\)]?)?/gi) || [])
            .reduce((agg, current) => {
                const tag = new Tag(current);
                return {
                    ...agg,
                    [tag.name]: tag
                }
            }, {});

        const tableMatch = /\((.*?)\);/.exec(tableFile);
        if (tableMatch) {
            const fieldsAsStringWithParenthesis = tableMatch[1];
            const fieldsAsString = fieldsAsStringWithParenthesis;
            const fields = fieldsAsString.split(',').reduce((agg: string[], curr: string, i: number) => {
                if (i === 0) {
                    return [curr];
                }
                const aggMatchOpen = agg[agg.length - 1].match(/\(/g);
                if (aggMatchOpen) {
                    const aggMatchClose = agg[agg.length - 1].match(/\)/g);
                    if (!aggMatchClose) {
                        agg[agg.length - 1] += ',' + curr;
                        return agg;
                    } else if (aggMatchOpen.length > aggMatchClose.length) {
                        agg[agg.length - 1] += ',' + curr;
                        return agg;
                    }
                }
                agg.push(curr);
                return agg;
            }, []).map(x => x.trim());
            const newFields = fields.map(x => {
                return {
                    fullText: x,
                    split: x.split(' ')
                };
            });
            for (let i = 0; i < newFields.length; i++) {
                const field = newFields[i];
                if (TableConstraintsFirstWord.find(fw => field.split[0].toLowerCase().indexOf(fw) > -1)) {
                    continue;
                }
                this.fields[field.split[0]] = new DatabaseTableField(field, this.tableSuffix);
            }
        }
        const primaryKeyName = Object.keys(this.fields).find(x => this.fields[x].isPrimaryKey);
        if (primaryKeyName) {
            this.primaryKey = this.fields[primaryKeyName];
        }
    }
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
    };
    _parameters: {
        [name: string]: string[];
    }

    constructor(params?: any) {
        params = params || {};
        this.setup = params.setup || {};
        this.table = params.table || {};
        this.function = params.function || {};
        this.index = params.index || {};
        this.type = params.type || {};
        this.data = params.data || {};
        this.sequence = params.sequence || {};
        this.trigger = params.trigger || {};
        this.view = params.view || {};
        this['foreign-servers'] = params['foreign-servers'] || {};
        this['user-mappings'] = params['user-mappings'] || {};
        this['local-tables'] = params['local-tables'] || {};
        this['foreign-tables'] = params['foreign-tables'] || {};
        this['source-specific-app-setup'] = params['source-specific-app-setup'] || {};
        this['data-transfers'] = params['data-transfers'] || {};
        this['external-system-integrations'] = params['external-system-integrations'] || {};
        this['data-exchange'] = params['data-exchange'] || {};
        this['users-roles-permissions'] = params['users-roles-permissions'] || {};
        this['full-text-catalogues'] = params['full-text-catalogues'] || {};
        this._properties = params._properties || {
            dbName: '',
            hasCurrent: false,
            path: '',
        };
        this._parameters = params._parameters || {};
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
            return new DatabaseFile(fileNameMinusVersion, file.replace(/\.\.\\/g, ''));
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