import { DatabaseObject } from "../models/database-file.model";
import { FileUtils } from "../utils/file.utils";
import { DatabaseRepositoryReader } from "./database-repo-reader";
import path from 'path';
import { LoggerUtils } from "../utils/logger.utils";
import { Bar, Presets } from "cli-progress";

const intentationSpaceNumber = 4;
const indentationSpaces = ' '.repeat(intentationSpaceNumber);

export class DatabaseFileHelper {
    private static _origin = 'DatabaseFileHelper';
    static dbTemplatesFolder = '../../data/db/templates';
    static async createFunctions(params: {
        applicationName: string;
        filter: string;
    }): Promise<boolean> {
        LoggerUtils.info({origin: this._origin, message: `Getting ready to create functions.`});

        if (!params.applicationName) {
            throw 'Please provide an application name';
        }
        if (!params.applicationName.match(/\-database$/)) {
            params.applicationName += '-database';
        }
        let fileData: { [name: string]: DatabaseObject } = {};
        
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader.postgresDbDataPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseRepositoryReader.postgresDbDataPath);
        }

        if (!fileData[params.applicationName]) {
            throw 'This application does not exist';
        }
        const databaseObject = fileData[params.applicationName];

        const actions = [
            'save',
            'get',
            'list',
            'delete',
        ];
        let filesCreated = 0;
        
        const tables = Object.keys(databaseObject.table);
        const bar = new Bar({
            format: `Functions  [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
            clearOnComplete: true
        }, Presets.shades_grey);
        bar.start(tables.length * 4, 0);

        // todo create the current folder
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
    
                // deal with joins later
                dbParams.joins = '';
    
                // we are going to create the functions in the current folder for now, and see later
    
                const folderPath = path.resolve(databaseObject._properties.path, 'postgres', 'release', 'current', '07-functions', nameWithoutPrefixAndSuffix);
    
                FileUtils.createFolderStructureIfNeeded(folderPath);
                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    if (!databaseObject.table[tableName].tags[`no-${action}`]) {
                        if (FileUtils.checkIfFolderExists(path.resolve(folderPath, `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`))) {
                            // todo what do we do if the file does exist ?
                        }
                        let fileString = await FileUtils.readFile(path.resolve(process.argv[1], DatabaseFileHelper.dbTemplatesFolder, `${action}.sql`));
        
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
        
                        FileUtils.writeFileSync(path.resolve(folderPath, `${dbParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}.sql`), fileString);
                        filesCreated++;
                        bar.update(filesCreated + 1);
                    }
                }
            }
        }
        bar.stop();
        if (filesCreated) {
            LoggerUtils.success({origin: this._origin, message: `Created ${filesCreated} files.`});
        } else {
            LoggerUtils.warning({origin: this._origin, message: `No files created`});
        }
        return await Promise.resolve(true);
    }
}