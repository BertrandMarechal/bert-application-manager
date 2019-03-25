import { DatabaseObject, DatabaseVersionFile, DatabaseTable, Tag } from "../../models/database-file.model";
import { FileUtils } from "../../utils/file.utils";
import path from 'path';
import colors from 'colors';
import { Bar, Presets } from "cli-progress";
import {DatabaseHelper} from './database-helper';
import { DatabaseRepositoryReader } from "./database-repo-reader";
import { RepositoryUtils } from "../../utils/repository.utils";
import { UiUtils } from "../../utils/ui.utils";
import { indentation } from "../../utils/syntax.utils";

export const intentationSpaceNumber = 4;
export const indentationSpaces = ' '.repeat(intentationSpaceNumber);

export class DatabaseFileHelper {
    private static _origin = 'DatabaseFileHelper';

    private static async _getVersionToChange(params: {
        version?: string;
    }, databaseVersionFiles: DatabaseVersionFile[], uiUtils: UiUtils): Promise<string> {
        const databaseVersionFile: DatabaseVersionFile | undefined = databaseVersionFiles[databaseVersionFiles.length - 1];
        let versionToChange = params.version;
        if (params.version && databaseVersionFile.versionName !== params.version) {
            throw 'The version you provided is not the last version. Please check and try again.';
        } else {
            const lastVersion = databaseVersionFiles[databaseVersionFiles.length - 1];
            versionToChange = lastVersion.versionName;
            if (!lastVersion) {
                throw 'No version found, please run init in the repo to initialize the DB code';
            }
            if (lastVersion.versionName !== 'current') {
                let ok = false;
                while (!ok) {
                    const response = await uiUtils.question({origin: this._origin, text: `The last version is not current (last version = ${versionToChange}). If you wish to amend this version, please use "y". If you want to create a new version (current folder), please use "c".`});
                    if (response === 'c') {
                        versionToChange = 'current';
                        ok = true;
                    } else if (response === 'y') {
                        ok = true;
                    } else {
                        uiUtils.warning({origin: this._origin, message: 'Incorrect response'});
                    }
                }
            }
        }
        return versionToChange;
    }
    static async createFunctions(params: {
        applicationName: string;
        version?: string;
        filter?: string;
    }, uiUtils: UiUtils): Promise<boolean> {
        uiUtils.info({origin: this._origin, message: `Getting ready to create functions.`});
        
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
        
        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        if (!databaseObject) {
            throw 'This application does not exist';
        }

        const databaseVersionFiles: DatabaseVersionFile[] = await DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
        const versionToChange = await DatabaseFileHelper._getVersionToChange(params, databaseVersionFiles, uiUtils);

        const actions = [
            'save',
            'get',
            'list',
            'delete',
        ];
        let filesCreated = 0;
        let filesIgnored = 0;
        let filesOverwritten = 0;
        
        const tables = Object.keys(databaseObject.table);
        const bar = new Bar({
            format: `Functions  [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
            clearOnComplete: true
        }, Presets.shades_grey);

        uiUtils.info({origin: this._origin, message: `Going to add the functions to version ${versionToChange}`});

        // bar.start(tables.length * 4, 0);

        
        const functionsToAdd: string[] = [];
        for (let t = 0; t < tables.length; t++) {
            const tableName = tables[t];
            if (!databaseObject.table[tableName].tags.ignore) {
                const dbParams: {[name: string]: string} = {
                    'entity_name': 'entity',
                    'db_prefix': 'db',
                    'roles': 'null',
                    'table_name': 'cbt_entity_ety',
                    'primary_key_name': 'pk_ety_id',
                    'camel_cased_fields': '',
                    'table_fields': '',
                    'joins': '',
                    'table_fields_update': '',
                    'table_fields_insert': '',
                    'params_fields_insert': '',
                    'list_filters': '',
                    'list_json_object': '',
                    'list_sorting': '',
                }
                const dbParamsFields = Object.keys(dbParams);                
                const nameWithoutPrefixAndSuffix = tableName
                    .replace(new RegExp(`\_${databaseObject.table[tableName].tableSuffix}$`), '')
                    .replace(new RegExp(`^${databaseObject._properties.dbName}t\_`), '');
                dbParams.entity_name = nameWithoutPrefixAndSuffix;
                dbParams.db_prefix = databaseObject._properties.dbName;
                dbParams.table_name = tableName;
                dbParams.primary_key_name = `pk_${databaseObject.table[tableName].tableSuffix}_id`;
    
                const fields = Object.keys(databaseObject.table[tableName].fields);

                // we now get the list of sub entities relative to this table, with the get-with-parent tag
                const tablesToRetrieveAlong: {fieldName: string, table: DatabaseTable}[] = Object.keys(databaseObject.table).map(t => {
                    const fieldsToGet = Object.keys(databaseObject.table[t].fields)
                        .filter(f => databaseObject.table[t].fields[f].isForeignKey)
                        .filter(f => databaseObject.table[t].fields[f].foreignKey &&
                            (databaseObject.table[t].fields[f].foreignKey || {table: ''}).table === tableName);
                    if (fieldsToGet.filter(f => databaseObject.table[t].fields[f].tags['get-with-parent']).length) {
                        return fieldsToGet.map(field => ({fieldName: field, table: databaseObject.table[t]}));
                    }
                    return [{fieldName: '', table: new DatabaseTable()}];
                })
                    .reduce((agg, curr) => agg.concat(curr), [])
                    .filter(x => !!x.fieldName);
    
                const 
                    camelCasedFields: string[] = [],
                    tableFields: string[] = [],
                    tableFieldsUpdate: string[] = [],
                    tableFieldsInsert: string[] = [],
                    paramsFieldsInsert: string[] = [],
                    listFilters: string[] = [],
                    listJsonObject: string[] = [],
                    listSortingAsc: string[] = [],
                    listSortingDesc: string[] = [];
    
                for (let i = 0; i < fields.length; i++) {
                    const field = databaseObject.table[tableName].fields[fields[i]];
                    camelCasedFields.push(`${indentationSpaces.repeat(2)}"${field.camelCasedName}" ${field.type}`);
                    tableFields.push(indentationSpaces.repeat(2) + field.name);
                    
                    if (tablesToRetrieveAlong.length) {
                        for (let j = 0; j < tablesToRetrieveAlong.length; j++) {
                            const subTable = tablesToRetrieveAlong[j];
                            camelCasedFields.push(`${indentationSpaces.repeat(2)}"${subTable.table.camelCasedName}" json`);

                            let subQuery = `${indentationSpaces.repeat(2)}(\n`;
                            subQuery += `${indentationSpaces.repeat(3)}SELECT COALESCE(JSON_AGG(\n`;
                            subQuery += `${indentationSpaces.repeat(4)}json_build_object(\n`;
                            subQuery += Object.keys(subTable.table.fields).map(field => {
                                return `${indentationSpaces.repeat(5)}'${subTable.table.fields[field].camelCasedName}', ${subTable.table.fields[field].name}`;
                            }).join(',\n');
                            subQuery += `${indentationSpaces.repeat(4)})\n`;
                            subQuery += `${indentationSpaces.repeat(3)}) FILTER(where sub${j}.modified_at is not null), '[]'::json)\n`;
                            subQuery += `${indentationSpaces.repeat(3)}FROM ${subTable.table.name} sub${j}\n`;
                            subQuery += `${indentationSpaces.repeat(4)}where sub${j}.${subTable.table.primaryKey ? subTable.table.primaryKey.name : 'id'} = ${subTable.fieldName}\n`;
                            subQuery += `${indentationSpaces.repeat(2)})\n`;
                            tableFields.push(subQuery);
                        }
                    }

                    if (field.toUpdate) {
                        tableFieldsUpdate.push(`${indentationSpaces.repeat(4)}${field.name} = (i_params->>'${field.camelCasedName}')::${field.type}`);
                    }
                    if (field.toUpdate) {
                        tableFieldsInsert.push(`${indentationSpaces.repeat(3)}${field.name}`);
                        paramsFieldsInsert.push(`${indentationSpaces.repeat(3)}(i_params->>'${field.camelCasedName}')::${field.type}`);
                    }
                    if (field.isListFilter) {
                        if (field.type.match(/text/i)) {
                            listFilters.push(`${indentationSpaces.repeat(4)}(i_params->'filters'->>'${field.listFilterName}' IS null OR ${field.name} ilike '%' || (i_params->'filters'->>'${field.listFilterName}')::TEXT || '%')`);
                        } else if (field.type.match(/integer/i)) {
                            listFilters.push(`${indentationSpaces.repeat(4)}(i_params->'filters'->>'${field.listFilterName}' IS null OR ${field.name} = i_params->'filters'->>'${field.listFilterName}')::INTEGER)`);
                        }
                        // todo add the other types
                    }
                    if (field.retrieveInList) {
                        listJsonObject.push(`${indentationSpaces.repeat(6)}'${field.camelCasedName}',  ${field.name}`);
                    }
                    if (field.sort) {
                        listSortingAsc.push(`${indentationSpaces.repeat(7)}WHEN (i_params->>'sorting') = '${field.camelCasedName}' AND (i_params->>'direction') = 'asc' THEN ${field.name}`);
                        listSortingDesc.push(`${indentationSpaces.repeat(7)}WHEN (i_params->>'sorting') = '${field.camelCasedName}' AND (i_params->>'direction') = 'desc' THEN ${field.name}`);
                    }
                }
                dbParams.camel_cased_fields = camelCasedFields.join(',\n');
                dbParams.table_fields = tableFields.join(',\n');
                dbParams.table_fields_update = tableFieldsUpdate.join(',\n');
                dbParams.table_fields_insert = tableFieldsInsert.join(',\n');
                dbParams.params_fields_insert = paramsFieldsInsert.join(',\n');
                dbParams.list_filters = listFilters.length > 0 ? 
                    `${indentationSpaces.repeat(3)}WHERE(\n${listFilters.join(' OR \n')}\n${indentationSpaces.repeat(3)})`
                    : '';
                dbParams.list_json_object = listJsonObject.join(',\n');
                if (listSortingAsc.length) {
                    dbParams.list_sorting = `${indentationSpaces.repeat(5)}ORDER BY\n`;
                    dbParams.list_sorting += `${indentationSpaces.repeat(6)}(CASE\n`;
                    dbParams.list_sorting += listSortingAsc.join('\n');
                    dbParams.list_sorting += `\n${indentationSpaces.repeat(6)}END) ASC,\n`;
    
                    dbParams.list_sorting += `${indentationSpaces.repeat(6)}(CASE\n`;
                    dbParams.list_sorting += listSortingDesc.join('\n');
                    dbParams.list_sorting += `\n${indentationSpaces.repeat(6)}END) DESC\n`;
                } else {
                    dbParams.list_sorting = '';
                }
                
                // todo deal with joins later
                dbParams.joins = '';
    
                const folderPath = path.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'schema', '07-functions', nameWithoutPrefixAndSuffix);
                FileUtils.createFolderStructureIfNeeded(folderPath);
                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    if (!databaseObject.table[tableName].tags[`no-${action}`]) {
                        let fileString = await FileUtils.readFile(path.resolve(process.argv[1], DatabaseHelper.dbTemplatesFolder, `${action}.sql`));
        
                        for (let j = 0; j < dbParamsFields.length; j++) {
                            const param = dbParamsFields[j];
                            let valueToReplaceWith = dbParams[param];

                            switch (param) {
                                case 'roles':
                                    let roles = '';
                                    if (databaseObject.table[tableName].tags[`${action}-roles`]) {
                                        if (databaseObject.table[tableName].tags[`${action}-roles`].value.match(/^\[[a-zA-Z0-9-_' ,]+\]$/)) {
                                            roles = databaseObject.table[tableName].tags[`${action}-roles`].value;
                                        }
                                    }
                                    if (databaseObject.table[tableName].tags[`roles`]) {
                                        if (databaseObject.table[tableName].tags[`roles`].value.match(/^\[[a-zA-Z0-9-_' ,]+\]$/)) {
                                            roles = databaseObject.table[tableName].tags[`roles`].value;
                                        }
                                    }
                                    roles = roles
                                        .replace(/\'/g, '"')
                                        .replace(/\[/g, '{')
                                        .replace(/\]/g, '}');
                                    if (roles) {
                                        valueToReplaceWith = `'${roles}'`;
                                    }
                                    break;
                                default:
                                    
                                    break;
                            }
                            fileString = fileString.replace(new RegExp(`<${param}>`, 'gi'), valueToReplaceWith);
                        }

                        let writeFile = true;
    
                        if (FileUtils.checkIfFolderExists(path.resolve(folderPath, `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`))) {
                            // we have an existing file. We get the content, and check if it is different. If yer, we override
                            const currentFileCOntent = await FileUtils.readFile(path.resolve(folderPath, `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`));
                            if (currentFileCOntent !== fileString) {
                                writeFile = true;
                                filesOverwritten++;
                            } else {
                                writeFile = false;
                                filesIgnored++;
                            }
                        } else {
                            writeFile = true;
                        }
                        if (writeFile) {
                            const fileName = `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`;
                            FileUtils.writeFileSync(path.resolve(folderPath, `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`), fileString);
                            filesCreated++;
                            
                            functionsToAdd.push(
                                ['../','postgres', 'release', versionToChange, 'schema', '07-functions', nameWithoutPrefixAndSuffix, fileName].join('/')
                            );
                        }
                        bar.update(4 * t + i);
                    }
                }
            }
        }
        // bar.stop();
        let feedback = 'No files created.';

        if (filesCreated) {
            feedback = `Created ${filesCreated} files.`
        }
        if (filesIgnored) {
            feedback += ` ${colors.yellow(`${filesIgnored}`)} files ignored (as unchanged)`;
        }
        if (filesOverwritten) {
            feedback += ` ${colors.yellow(`${filesOverwritten}`)} files overwritten`;
        }

        if (filesCreated) {
            uiUtils.success({origin: this._origin, message: feedback});
        } else {
            uiUtils.warning({origin: this._origin, message: feedback});
        }

        if (filesCreated || filesOverwritten) {
            // if something has been changed, we update the file
            await DatabaseFileHelper.updateVersionFile(databaseObject._properties.path, versionToChange, functionsToAdd, params.applicationName, uiUtils);
        }
        return await Promise.resolve(true);
    }

    private static async updateVersionFile(filePath: string, version: string, filePaths: string[], applicationName: string, uiUtils: UiUtils) {
        
            // if something has been changed, we update the file
            const newVersionJsonPath = path.resolve(filePath, 'postgres', 'release', version, 'version.json');
            const versionJsonPath = path.resolve(process.argv[1], '../../data/db/database-structure/files/version.json');
            let versionJsonFile = await FileUtils.readJsonFile(versionJsonPath);
            
            if (FileUtils.checkIfFolderExists(newVersionJsonPath)) {
                versionJsonFile = await FileUtils.readJsonFile(newVersionJsonPath);
            }
            
            // todo list versions to add
            // todo update version.json
            versionJsonFile[versionJsonFile.length - 1].fileList = [
                ...versionJsonFile[versionJsonFile.length - 1].fileList,
                ...filePaths
            ];
            
            FileUtils.createFolderStructureIfNeeded(newVersionJsonPath);
            FileUtils.writeFileSync(newVersionJsonPath, JSON.stringify(versionJsonFile, null, 2));
            
            await DatabaseRepositoryReader.readRepo(filePath, applicationName, uiUtils);
    }

    static async createTable(params: {
        applicationName: string;
        version?: string;
        tableDetails?: {
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
                tags?: Tag[];
            }[]
        }
    }, uiUtils: UiUtils) {
        uiUtils.info({origin: this._origin, message: `Getting ready to create table.`});
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
        
        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        if (!databaseObject) {
            throw 'This application does not exist';
        }
        
        const databaseVersionFiles: DatabaseVersionFile[] = await DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
        const versionToChange = await DatabaseFileHelper._getVersionToChange(params, databaseVersionFiles, uiUtils);
        
        if (!params.tableDetails || (params.tableDetails && !params.tableDetails.name)) {
            // we have User Interraction to build the table
            let tableName = '';
            while (!tableName) {
                let newTableName = await uiUtils.question({origin: DatabaseFileHelper._origin, text: 'Please provide a table name'});
                if (!DatabaseFileHelper._checkNewNameHasUnderscoresAndAlphanumerics(newTableName)) {
                    uiUtils.warning({origin: DatabaseFileHelper._origin, message: 'Please use snake cased alphanumeric characters'});
                    tableName = '';
                } else {
                    tableName = await DatabaseFileHelper._checkNewTableName(databaseObject, newTableName, uiUtils);
                }
            }
            //table name is valid.
            const tablePrefix = tableName.substr(-3);
            params.tableDetails = {
                name: tableName,
                fields: [{
                    isPrimaryKey: true,
                    name: `pk_${tableName.substr(-3)}_id`,
                    type: 'serial',
                    unique: true,
                    notNull: true
                }],
                tags: [],
            };
            uiUtils.info({origin: DatabaseFileHelper._origin, message: `Table name: ${params.tableDetails.name}`});

            // ask about fields
            let finished = false;
            let newFieldName = await uiUtils.question({origin: DatabaseFileHelper._origin, text: 'Please provide a field name'});
            while (!finished) {
                while (!DatabaseFileHelper._checkNewNameHasUnderscoresAndAlphanumerics(newFieldName)) {
                    newFieldName = await uiUtils.question({origin: DatabaseFileHelper._origin, text: 'Please provide a field name (basic types offered here, you can also type your own type)'});
                }
                const types = [
                    'text',
                    'integer',
                    'timestamp',
                    'date',
                    'float',
                    'boolean'
                ];
                let selectedType = await uiUtils.question({origin: DatabaseFileHelper._origin, text: `Please select a type, or type the desired one : \n${types.map((x, i) => {
                    return `\t ${i + 1} - ${x}`;
                }).join('\n')}`});
                while (!selectedType) {
                    await uiUtils.question({origin: DatabaseFileHelper._origin, text: `Please select a type, or type the desired one : \n${types.map((x, i) => {
                        return `\t ${i + 1} - ${x}`;
                    }).join('\n')}`});
                }
                if (+selectedType && types[+selectedType - 1]) {
                    selectedType = types[+selectedType - 1];
                }
                params.tableDetails.fields.push({
                    name: `${tablePrefix}_${newFieldName}`,
                    type: selectedType
                });
                const paramIndex = params.tableDetails.fields.length - 1;
                params.tableDetails.fields[paramIndex].notNull = (await uiUtils.question({origin: DatabaseFileHelper._origin, text: 'Should it be not null ? (y for yes)'})).toLowerCase()  === 'y';
                if (params.tableDetails.fields[paramIndex].notNull) {
                    params.tableDetails.fields[paramIndex].default = ( await uiUtils.question({origin: DatabaseFileHelper._origin, text: 'Please provide a default value (press enter for none)'}));
                    if (!params.tableDetails.fields[paramIndex].default) {
                        params.tableDetails.fields[paramIndex].default = undefined;
                    }
                }
                params.tableDetails.fields[paramIndex].unique = (await uiUtils.question({origin: DatabaseFileHelper._origin, text: 'Should it be unique ? (y for yes)'})).toLowerCase()  === 'y';

                // next
                newFieldName = await uiUtils.question({origin: DatabaseFileHelper._origin, text: 'Please provide the next field name'});
                finished = !newFieldName;
            }
            params.tableDetails.fields = params.tableDetails.fields.concat([{
                    name: 'created_by',
                    type: 'CHAR(4)',
                    notNull: true
                },
                {
                    name: 'created_at',
                    type: 'TIMESTAMPTZ',
                    notNull: true,
                    default: 'CURRENT_TIMESTAMP'
                },
                {
                    name: 'modified_by',
                    type: 'CHAR(4)',
                    notNull: true
                },
                {
                    name: 'modified_at',
                    type: 'TIMESTAMPTZ',
                    notNull: true,
                    default: 'CURRENT_TIMESTAMP'
                }]);
        }
        // we try and build the table based on the provided details
        let tableString = `CREATE OR REPLACE TABLE public."${params.tableDetails.name}" (\n`;
        tableString += params.tableDetails.fields.map(field => {
            let fieldString = `${indentation}${field.name} ${field.type}`;
            fieldString += `${field.isPrimaryKey ? ' PRIMARY KEY' : ''}`;
            fieldString += `${field.unique ? ' UNIQUE' : ''}`;
            fieldString += `${field.notNull ? ' NOT' : ''} NULL`;
            fieldString += `${field.notNull && field.default ? ` DEFAULT ${field.default}` : ''}`;
            return fieldString;
        }).join(',\n');
        tableString += '\n);';
        console.log(tableString);
        
        
        const fileName = `${params.tableDetails.name}.sql`;
        const folderPath = path.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'schema', '03-tables');
        FileUtils.writeFileSync(path.resolve(folderPath, fileName), tableString);
        
        await DatabaseFileHelper.updateVersionFile(databaseObject._properties.path, versionToChange, [
            ['../','postgres', 'release', versionToChange, 'schema', '03-tables', fileName].join('/')
        ], params.applicationName, uiUtils);
    }
    private static _checkNewNameHasUnderscoresAndAlphanumerics(tableName: string): boolean {
        return /^[a-z0-9_]+$/i.test(tableName);
    }
    private static async _checkNewTableName(databaseObject: DatabaseObject, tableName: string, uiUtils: UiUtils): Promise<string> {
        if (tableName.indexOf(databaseObject._properties.dbName) !== 0) {
            tableName = databaseObject._properties.dbName + 't_' + tableName;
        }
        
        // loop on all the other tables, and check if one stats the same
        const existingTables = Object.keys(databaseObject.table)
            .filter(t => {
                return t.indexOf(tableName) === 0 && t.length === tableName.length + 4;
            });
        if (existingTables.length > 0) {
            return '';
        }

        const probablyHasSuffix = !!tableName.match(/_[a-z][a-z0-9]{1,2}$/i);
        let hasSuffix = false;
        if (probablyHasSuffix) {
            hasSuffix = (await uiUtils.question({origin: DatabaseFileHelper._origin, text: 'It seems that you provided a suffix for this table, pleas confirm (y/n)'})) === 'y';
        }
        if (hasSuffix) {
            return tableName;
        }
        const takenSuffixes = Object.keys(databaseObject.table).map(t => {
            return t.split('_')[t.split('_').length - 1];
        });
        const tableNameSplit = tableName.split('_');
        console.log(tableNameSplit);
        
        let suffix = tableNameSplit[1].substr(0,1);
        // we first try one suffix, as we would like it, then we loop
        if (tableNameSplit.length >= 4) {
            suffix += tableNameSplit[2].substr(0,1) + tableNameSplit[3].substr(0,1);
        } else if (tableNameSplit.length === 3) {
            suffix += tableNameSplit[1].substr(1,1) + tableNameSplit[2].substr(0,1);
        } else {
            suffix = tableNameSplit[1].substr(0, 3);
        }
        let tries = 1;
        const tableNameWIthoutDBName = tableName.substr(4);
        while (takenSuffixes.indexOf(suffix) > -1 && tries < tableName.length - (3 + tableNameSplit.length)) {
            // we get crazy
            suffix = 
                tableNameWIthoutDBName.substr(Math.floor(tableNameWIthoutDBName.length * Math.random()), 1) +
                tableNameWIthoutDBName.substr(Math.floor(tableNameWIthoutDBName.length * Math.random()), 1) +
                tableNameWIthoutDBName.substr(Math.floor(tableNameWIthoutDBName.length * Math.random()), 1);
            tries++;
        }
        if (takenSuffixes.indexOf(suffix) > -1) {
            // numbers ?
            tries = 0;
            while (takenSuffixes.indexOf(suffix) > -1 && tries < 100) {
                // we get crazy
                suffix = tableNameWIthoutDBName.substr(tries < 10 ? 2 : 1, 1) + (tries < 10 ? `0${tries}` : `${tries}`);
                tries++;
            }
        }

        if (takenSuffixes.indexOf(suffix) > -1) {
            // what DB is that ???
            throw 'Could not find a proper suffix for this table. try providing one in the name';
        }
        return tableName + '_' + suffix;
    }
}