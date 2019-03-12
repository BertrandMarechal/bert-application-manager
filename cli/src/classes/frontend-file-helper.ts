import path from 'path';
import colors from 'colors';
import {DatabaseHelper} from './database-helper';
import { Bar, Presets } from "cli-progress";
import { DatabaseObject, DatabaseTableField } from '../models/database-file.model';
import { FileUtils } from '../utils/file.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { SyntaxUtils } from '../utils/syntax.utils';

const indentation = '  ';

interface FileAndContent {
    path: string;
    fileContent: string;
}

export class FrontendFileHelper {
    private static _origin = 'FrontendFileHelper';
    static frontendTemplatesFolder = path.resolve(process.argv[1], '../../data/frontend/templates');

    static async generateCode(params: {
        applicationName: string;
        filter: string;
    }) {

        if (!params.applicationName) {
            throw 'Please provide an application name';
        }
        if (!params.applicationName.match(/\-frontend$/)) {
            params.applicationName += '-frontend';
        }
        const applicationDatabaseName = params.applicationName.replace(/\-frontend$/, '-database');

        // read the db File, to get the list of functions
        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(applicationDatabaseName);
        if (!databaseObject) {
            throw 'This application does not exist';
        }
        
        const actions = [
            'get',
            'list',
            'delete',
            'save',
        ];
        let filesCreated = 0;
        let filesIgnored = 0;
        let filesOverwritten = 0;
        
        const tables = Object.keys(databaseObject.table);
        const bar = new Bar({
            format: `Functions  [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
            clearOnComplete: true
        }, Presets.shades_grey);
        bar.start(tables.length * 4, 0);

        const filesToCreate: FileAndContent[] = [];
        const frontendPath = path.resolve(databaseObject._properties.path.replace('database', 'frontend'), 'frontend');
        const serviceFileTemplate = await FileUtils.readFile(path.resolve(FrontendFileHelper.frontendTemplatesFolder, 'service.ts'));
        const modelFileTemplate = await FileUtils.readFile(path.resolve(FrontendFileHelper.frontendTemplatesFolder, 'model.ts'));
        const ngrxActionsFileTemplate = await FileUtils.readFile(path.resolve(FrontendFileHelper.frontendTemplatesFolder, 'ngrx-actions.ts'));

        for (let t = 0; t < tables.length; t++) {
            const tableName = tables[t];
            const nameWithoutPrefixAndSuffix = tableName
                    .replace(new RegExp(`\_${databaseObject.table[tableName].tableSuffix}$`), '')
                    .replace(new RegExp(`^${databaseObject._properties.dbName}t\_`), '');
            const nameWithDashes = nameWithoutPrefixAndSuffix.replace(/_/g, '-');
            const nameWithoutUnderscore = nameWithoutPrefixAndSuffix.replace(/_/g, '');
            const capitalizedCamelCasedName = databaseObject.table[tableName].camelCasedName.substr(0, 1).toUpperCase() +
                databaseObject.table[tableName].camelCasedName.substr(1);
            // model
            filesToCreate.push({
                path: path.resolve(frontendPath, 'src', 'app', 'models', `${nameWithDashes}.model.ts`),
                fileContent: modelFileTemplate
                    .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
                    .replace(/<fields>/g, FrontendFileHelper._createModelFile(
                        Object.keys(databaseObject.table[tableName].fields).map(key => 
                            databaseObject.table[tableName].fields[key]
                        )
                    ))
            });
            // functions
            const serviceFile: FileAndContent = {
                path: path.resolve(frontendPath, 'src', 'app', 'services', `${nameWithDashes}.service.ts`),
                fileContent: serviceFileTemplate
                    .replace(/<camel_cased_name>/g, databaseObject.table[tableName].camelCasedName)
                    .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
                    .replace(/<name_with_dashes>/g, nameWithDashes)
            };
            const serviceFunctions: string[] = [];
            // ngrx actions
            const ngrxActionsFile: FileAndContent = {
                path: path.resolve(frontendPath, 'src', 'app', 'store', 'actions', `${nameWithDashes}.actions.ts`),
                fileContent: ngrxActionsFileTemplate
                    .replace(/<snake_case_actions_upper_case>/g, nameWithoutPrefixAndSuffix.toUpperCase())
                    .replace(/<snake_case_actions_lower_case>/g, nameWithoutPrefixAndSuffix.toLowerCase())
            };
            const ngrxActions: {
                names: string;
                classes: string;
                types: string;
            }[] = [];

            if (!databaseObject.table[tableName].tags.ignore) {
                // create service file
                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    
                    bar.update(4 * t + i + 1);
                    const functionName = action + nameWithoutUnderscore;
                    serviceFunctions.push(FrontendFileHelper._createFrontendServiceFunction({
                        action: action,
                        capitalizedCamelCasedName: capitalizedCamelCasedName,
                        serviceFunctionName: functionName,
                        serviceName: databaseObject._properties.dbName + '-s'
                    }));

                    ngrxActions.push(FrontendFileHelper._createActions({
                        action: action,
                        dbObjectName: nameWithoutUnderscore
                    }));
                }
            }
            if (serviceFunctions.length) {
                serviceFile.fileContent = serviceFile.fileContent.replace(
                    /<functions>/,
                    serviceFunctions.join('\n\n')
                );
                filesToCreate.push(serviceFile);
            }
            if (ngrxActions.length) {
                ngrxActionsFile.fileContent = ngrxActionsFile.fileContent
                    .replace(
                        /<action_names>/,
                        ngrxActions.map(x => x.names).join('\n\n')
                    )
                    .replace(
                        /<action_classes>/,
                        ngrxActions.map(x => x.classes).join('\n\n')
                    )
                    .replace(
                        /<action_types>/,
                        ngrxActions.map(x => x.types).join('\n\n')
                    );
                filesToCreate.push(ngrxActionsFile);
            }
        }
        bar.stop();

        bar.start(filesToCreate.length, 0);
        for (let i = 0; i < filesToCreate.length; i++) {
            const fileToCreate = filesToCreate[i];
            FileUtils.createFolderStructureIfNeeded(fileToCreate.path);
            FileUtils.writeFileSync(fileToCreate.path, fileToCreate.fileContent);
        }
        bar.stop();
    }

    private static _createFrontendServiceFunction(params: {
        action: string;
        serviceName: string;
        serviceFunctionName: string;
        capitalizedCamelCasedName: string;
    }): string {
        let functionParameters = '';
        let lambdaFunctionParameters = '';
        switch (params.action) {
            case 'get':
                functionParameters = 'id: number';
                lambdaFunctionParameters = 'id: id';
                break;
            case 'delete':
                functionParameters = 'id: number';
                lambdaFunctionParameters = 'id: id';
                break;
            case 'list':
                functionParameters = 'params: any';
                lambdaFunctionParameters = 'params: params';
                break;
            case 'save':
                functionParameters = `params: ${params.capitalizedCamelCasedName}`;
                lambdaFunctionParameters = 'params: params';
                break;
            default:
                break;
        }
        let f = `${indentation}async ${params.action}${params.capitalizedCamelCasedName}(${functionParameters}): Promise<${params.capitalizedCamelCasedName}> {\n`;
        f += `${indentation.repeat(2)}apiName: '${params.serviceName}',\n`;
        f += `${indentation.repeat(2)}functionName: 'runfunction',\n`;
        f += `${indentation.repeat(2)}payload: {functionName: '${params.serviceFunctionName}', ${lambdaFunctionParameters}}\n`;
        f += `${indentation.repeat(2)}});\n`;
        f += `${indentation}}`;
        return f;
    }

    private static _createModelFile(fields: DatabaseTableField[]) {
        
        return fields.map(field => {
            return `${indentation}${field.camelCasedName}: ${FrontendFileHelper._databaseTypeToFrontendType(field.type)};`
        }).join('\n');
    }

    private static _databaseTypeToFrontendType(databaseType: string): string {
        const type = databaseType
            .trim()
            .toLowerCase()
            .split('(')[0]
            .split(' ')[0];
        switch (type) {
            case 'int':
            case 'integer':
            case 'serial':
                return 'number';
            case 'text':
            case 'char':
            case 'varchar':
            case 'nvarchar':
                return 'string';
            case 'boolean':
                return 'boolean';
            case 'date':
            case 'interval':
            case 'timestamp':
            case 'timestamptz':
            case 'datetime':
                return 'Date';
            case 'json':
            case 'jsonb':
                return 'any';
            default:
                LoggerUtils.warning({origin: this._origin, message: `Database Type "${databaseType}" not mapped`})
                break;
        }
        return 'any';
    }

    private static _createActions(params: {
        dbObjectName: string;
        action: string;
    }): {
        names: string;
        classes: string;
        types: string;
    } {
        const parts = [{
            source: 'page',
            state: ''
        }, {
            source: 'effect',
            state: ''
        }, {
            source: 'router',
            state: ''
        }, {
            source: 'service',
            state: 'complete'
        }, {
            source: 'service',
            state: 'failed'
        }];
        return {
            names: parts.map(part => {
                let toReturn = `export const ${part.source.toUpperCase()}_${params.action.toUpperCase()}_${params.dbObjectName.toUpperCase()}${part.state ? `_${part.state.toUpperCase()}` : ``}`;
                toReturn += ` = '[${params.dbObjectName} ${SyntaxUtils.capitalize(part.source)}]' ${params.action} ${params.dbObjectName.replace(/ /g, ' ')}`;
                return toReturn;
            }).join('\n'),
            classes: parts.map(part => {
                let toReturn = `export class ${SyntaxUtils.capitalize(part.source)}${SyntaxUtils.capitalize(params.action)}${SyntaxUtils.capitalize(SyntaxUtils.snakeCaseToCamelCase(params.dbObjectName))}${SyntaxUtils.capitalize(part.state)}Action implements Action {`;
                toReturn += `${indentation}readonly type = ${part.source.toUpperCase()}_${params.action.toUpperCase()}_${params.dbObjectName.toUpperCase()}${part.state ? `_${part.state.toUpperCase()}` : ``}`;
                toReturn += `${indentation}constructor(public payload?: any) {}`;
                toReturn += '}';
                return toReturn;
            }).join('\n'),
            types: parts.map(part => {
                return `${indentation}| ${SyntaxUtils.capitalize(part.source)}${SyntaxUtils.capitalize(params.action)}${SyntaxUtils.capitalize(SyntaxUtils.snakeCaseToCamelCase(params.dbObjectName))}${SyntaxUtils.capitalize(part.state)}Action`;
            }).join('\n'),
        }
    }
}