import { DatabaseObject, DatabaseVersionFile, DatabaseTable } from "../../models/database-file.model";
import { FileUtils } from "../../utils/file.utils";
import path from 'path';
import colors from 'colors';
import { LoggerUtils } from "../../utils/logger.utils";
import { Bar, Presets } from "cli-progress";
import {DatabaseHelper} from './database-helper';
import { DatabaseRepositoryReader } from "./database-repo-reader";
import { RepositoryUtils } from "../../utils/repository.utils";

export const intentationSpaceNumber = 4;
export const indentationSpaces = ' '.repeat(intentationSpaceNumber);

export class DatabaseFileHelper {
    private static _origin = 'DatabaseFileHelper';
    static async createFunctions(params: {
        applicationName: string;
        version: string;

        filter: string;
    }): Promise<boolean> {
        LoggerUtils.info({origin: this._origin, message: `Getting ready to create functions.`});
        
        await RepositoryUtils.checkOrGetApplicationName(params, 'database');
        
        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        if (!databaseObject) {
            throw 'This application does not exist';
        }

        const databaseVersionFiles: DatabaseVersionFile[] = await DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
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
                    const response = await LoggerUtils.question({origin: this._origin, text: `The last version is not current (last version = ${versionToChange}). If you wish to amend this version, please use "y". If you want to create a new version (current folder), please use "c".`});
                    if (response === 'c') {
                        versionToChange = 'current';
                        ok = true;
                    } else if (response === 'y') {
                        ok = true;
                    } else {
                        LoggerUtils.warning({origin: this._origin, message: 'Incorrect response'});
                    }
                }
            }
        }

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

        LoggerUtils.info({origin: this._origin, message: `Going to add the functions to version ${versionToChange}`});

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
            LoggerUtils.success({origin: this._origin, message: feedback});
        } else {
            LoggerUtils.warning({origin: this._origin, message: feedback});
        }

        if (filesCreated || filesOverwritten) {
            // if something has been changed, we update the file
            const newVersionJsonPath = path.resolve(databaseObject._properties.path, 'postgres', 'release', versionToChange, 'version.json');
            const versionJsonPath = path.resolve(process.argv[1], '../../data/db/database-structure/files/version.json');
            let versionJsonFile = await FileUtils.readJsonFile(versionJsonPath);
            
            if (FileUtils.checkIfFolderExists(newVersionJsonPath)) {
                versionJsonFile = await FileUtils.readJsonFile(newVersionJsonPath);
            }
            
            // todo list versions to add
            // todo update version.json
            versionJsonFile[versionJsonFile.length - 1].fileList = [
                ...versionJsonFile[versionJsonFile.length - 1].fileList,
                ...functionsToAdd
            ];
            
            FileUtils.createFolderStructureIfNeeded(newVersionJsonPath);
            FileUtils.writeFileSync(newVersionJsonPath, JSON.stringify(versionJsonFile, null, 2));
            
            await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName);
        }
        return await Promise.resolve(true);
    }
}