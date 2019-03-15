import path from 'path';
import colors from 'colors';
import {DatabaseHelper} from './database-helper';
import { Bar, Presets } from "cli-progress";
import { DatabaseObject, DatabaseTableField } from '../models/database-file.model';
import { FileUtils } from '../utils/file.utils';
import { LoggerUtils } from '../utils/logger.utils';
import { SyntaxUtils } from '../utils/syntax.utils';

const indentation = '  ';
const ngrxParts: {
    source: string;
    state: string;
    for: {
        [name: string]: boolean;
    };
}[] = [{
    source: 'page',
    state: '',
    for: {
        get: false,
        list: true,
        save: true,
        delete: true,
    }
}, {
    source: 'effect',
    state: '',
    for: {
        get: true,
        list: true,
        save: false,
        delete: false,
    }
}, {
    source: 'router',
    state: '',
    for: {
        get: true,
        list: true,
        save: false,
        delete: false,
    }
}, {
    source: 'service',
    state: 'complete',
    for: {
        get: true,
        list: true,
        save: true,
        delete: true,
    }
}, {
    source: 'service',
    state: 'failed',
    for: {
        get: true,
        list: true,
        save: true,
        delete: true,
    }
}];

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
        const ngrxReducersFileTemplate = await FileUtils.readFile(path.resolve(FrontendFileHelper.frontendTemplatesFolder, 'ngrx-reducers.ts'));
        const ngrxEffectsFileTemplate = await FileUtils.readFile(path.resolve(FrontendFileHelper.frontendTemplatesFolder, 'ngrx-effects.ts'));

        for (let t = 0; t < tables.length; t++) {
            const tableName = tables[t];
            const nameWithoutPrefixAndSuffix = tableName
                    .replace(new RegExp(`\_${databaseObject.table[tableName].tableSuffix}$`), '')
                    .replace(new RegExp(`^${databaseObject._properties.dbName}t\_`), '');
            const nameWithDashes = nameWithoutPrefixAndSuffix.replace(/_/g, '-');
            const nameWithoutUnderscore = nameWithoutPrefixAndSuffix.replace(/_/g, '');
            const camelCasedName = databaseObject.table[tableName].camelCasedName;
            const capitalizedCamelCasedName = camelCasedName.substr(0, 1).toUpperCase() +
                camelCasedName.substr(1);
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
                    .replace(/<camel_cased_name>/g, camelCasedName)
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
                    .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
            };
            const ngrxActions: {
                names: string;
                classes: string;
                types: string;
            }[] = [];

            // ngrx reducers
            const ngrxReducersFile: FileAndContent = {
                path: path.resolve(frontendPath, 'src', 'app', 'store', 'reducers', `${nameWithDashes}.reducers.ts`),
                fileContent: ngrxReducersFileTemplate
                    .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
                    .replace(/<name_with_dashes>/g, nameWithDashes)
                    .replace(/<camel_cased_name>/g, camelCasedName)
            };

            const ngrxReducers: {
                stateTypes: string;
                stateInitialState: string;
                stateCase: string;
            }[] = [];

            //ngrx effects
            const ngrxEffectsFile: FileAndContent = {
                path: path.resolve(frontendPath, 'src', 'app', 'store', 'effects', `${nameWithDashes}.effects.ts`),
                fileContent: ngrxEffectsFileTemplate
                    .replace(/<name_with_dashes>/g, nameWithDashes)
                    .replace(/<camel_cased_name>/g, camelCasedName)
                    .replace(/<capitalized_camel_cased_name>/g, capitalizedCamelCasedName)
            };
            const ngrxEffects: string[] = [];

            if (!databaseObject.table[tableName].tags.ignore) {
                // create service file
                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    
                    bar.update(4 * t + i + 1);
                    const upperCaseObjectName = nameWithoutPrefixAndSuffix.toUpperCase();
                    const upperCaseActionName = `${action.toUpperCase()}_${upperCaseObjectName}`;
                    const capitalizedActionName = `${SyntaxUtils.capitalize(action)}${SyntaxUtils.capitalize(SyntaxUtils.snakeCaseToCamelCase(nameWithoutPrefixAndSuffix))}`;

                    const functionName = action + nameWithoutUnderscore;
                    serviceFunctions.push(FrontendFileHelper._createFrontendServiceFunction({
                        action: action,
                        capitalizedCamelCasedName: capitalizedCamelCasedName,
                        serviceFunctionName: functionName,
                        serviceName: databaseObject._properties.dbName + '-s'
                    }));

                    ngrxActions.push(FrontendFileHelper._createActions({
                        action: action,
                        upperCaseObjectName: upperCaseObjectName,
                        upperCaseActionName: upperCaseActionName,
                        capitalizedActionName: capitalizedActionName,
                        capitalizedCamelCasedName: capitalizedCamelCasedName,
                    }));

                    ngrxReducers.push(FrontendFileHelper._createReducers({
                        action: action,
                        camelCaseName: camelCasedName,
                        capitalizedCamelCaseName: capitalizedCamelCasedName,
                        upperCaseActionName: upperCaseActionName,
                    }));

                    ngrxEffects.push(FrontendFileHelper._createEffect({
                        action: action,
                        camelCaseName: camelCasedName,
                        capitalizedCamelCaseName: capitalizedCamelCasedName,
                        upperCaseActionName: upperCaseActionName,
                        nameWithDashes: nameWithDashes,
                        route: ''
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
            if (ngrxReducers.length) {
                ngrxReducersFile.fileContent = ngrxReducersFile.fileContent
                    .replace(
                        /<types>/,
                        ngrxReducers.map(x => x.stateTypes).filter(Boolean).join('\n')
                    )
                    .replace(
                        /<initial_state>/,
                        ngrxReducers.map(x => x.stateInitialState).filter(Boolean).join('\n')
                    )
                    .replace(
                        /<cases>/,
                        ngrxReducers.map(x => x.stateCase).filter(Boolean).join('\n')
                    );
                filesToCreate.push(ngrxReducersFile);
            }
            if (ngrxEffects.length) {
                ngrxEffectsFile.fileContent = ngrxEffectsFile.fileContent
                    .replace(
                        /<effects>/,
                        ngrxEffects.join('\n')
                    );
                filesToCreate.push(ngrxEffectsFile);
            }
        }
        bar.stop();

        bar.start(filesToCreate.length, 0);
        for (let i = 0; i < filesToCreate.length; i++) {
            bar.update(i);
            const fileToCreate = filesToCreate[i];
            FileUtils.createFolderStructureIfNeeded(fileToCreate.path);
            FileUtils.writeFileSync(fileToCreate.path, fileToCreate.fileContent);
        }
        bar.stop();
        if (filesToCreate.length) {
            LoggerUtils.success({origin: this._origin, message: `Created ${filesToCreate.length} files`});
        } else {
            LoggerUtils.warning({origin: this._origin, message: `No files created`});
        }
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
        action: string;
        upperCaseObjectName: string;
        upperCaseActionName: string;
        capitalizedActionName: string;
        capitalizedCamelCasedName: string;
    }): {
        names: string;
        classes: string;
        types: string;
    } {
        let functionParameterType = '';
        // todo get the proper types
        switch (params.action) {
            case 'get':
                functionParameterType = 'any';
                break;
            case 'delete':
                functionParameterType = 'any';
                break;
            case 'list':
                functionParameterType = 'any';
                break;
            case 'save':
                functionParameterType = `any`;
                break;
            default:
                break;
        }
        return {
            names: ngrxParts
                .filter(x => x.for[params.action])
                .map(part => {
                    let toReturn = `export const ${part.source.toUpperCase()}_${params.upperCaseActionName}${part.state ? `_${part.state.toUpperCase()}` : ``}`;
                    toReturn += ` = \`[\$\{${params.upperCaseObjectName}\} ${SyntaxUtils.capitalize(part.source)}] ${params.action} ${params.upperCaseObjectName.toLocaleLowerCase().replace(/ /g, ' ')}\`;`;
                    return toReturn;
                }).join('\n'),
            classes: ngrxParts
                .filter(x => x.for[params.action])
                .map(part => {
                    let toReturn = `export class ${SyntaxUtils.capitalize(part.source)}${params.capitalizedActionName}${SyntaxUtils.capitalize(part.state)}Action implements Action {\n`;
                    toReturn += `${indentation}readonly type = ${part.source.toUpperCase()}_${params.upperCaseActionName}${part.state ? `_${part.state.toUpperCase()}` : ``};\n`;
                    toReturn += `${indentation}constructor(public payload?: ${functionParameterType}) {}\n`;
                    toReturn += '}';
                    return toReturn;
                }).join('\n'),
            types: ngrxParts
                .filter(x => x.for[params.action])
                .map(part => {
                    return `${indentation}| ${SyntaxUtils.capitalize(part.source)}${params.capitalizedActionName}${SyntaxUtils.capitalize(part.state)}Action`;
                }).join('\n'),
        }
    }

    private static _createReducers(params: {
        action: string;
        camelCaseName: string;
        capitalizedCamelCaseName: string;
        upperCaseActionName: string;
    }): {
        stateTypes: string;
        stateInitialState: string;
        stateCase: string;
    } {
        let types: string[] = [];
        let initialState: string[] = [];
        let cases: string[] = [];
        let actionBooleanPrefix = '';
        let actionvariablesSuffix = '';

        switch (params.action) {
            case 'get':
                actionBooleanPrefix = 'getting';
                break;
            case 'list':
                actionBooleanPrefix = 'getting';
                actionvariablesSuffix = 'List';
                break;
            case 'delete':
                actionBooleanPrefix = 'deleting';
                break;
            case 'save':
                actionBooleanPrefix = 'saving';
                break;
            default:
                break;
        }
        
        types = [
            `${indentation}${actionBooleanPrefix}${params.capitalizedCamelCaseName}${actionvariablesSuffix}: boolean;`,
            `${indentation}${params.camelCaseName}${actionvariablesSuffix}: ${params.capitalizedCamelCaseName}${params.action === 'list' ? '[]' : ''};`,
        ];
        initialState = [
            `${indentation}${actionBooleanPrefix}${params.capitalizedCamelCaseName}${actionvariablesSuffix}: true,`,
            `${indentation}${params.camelCaseName}${actionvariablesSuffix}: null,`,
        ];
        cases = ngrxParts
            .map(part => {
                let actionLine = `${indentation.repeat(2)}case ${params.capitalizedCamelCaseName}Actions.${part.source.toUpperCase()}_${params.upperCaseActionName}${part.state ? `_${part.state.toUpperCase()}` : ``}:\n`;
                let toReturn = `${indentation.repeat(3)}return {\n`;
                toReturn += `${indentation.repeat(4)}...state,\n`;
                if (part.source !== 'service') {
                    toReturn += `${indentation.repeat(4)}${actionBooleanPrefix}${params.capitalizedCamelCaseName}${actionvariablesSuffix}: true,\n`;
                } else {
                    toReturn += `${indentation.repeat(4)}${actionBooleanPrefix}${params.capitalizedCamelCaseName}${actionvariablesSuffix}: false,\n`;
                    if (part.state !== 'failed' && (params.action === 'get' || params.action === 'list')) {
                        toReturn += `${indentation.repeat(4)}${params.camelCaseName}${actionvariablesSuffix}: action.payload,\n`;
                    }
                }
                toReturn += `${indentation.repeat(3)}};`;
                return {actionLine, actionText: toReturn};
            })
            .reduce((agg: {actionLine: string, actionText: string}[], current) => {
                // we add the similar actions to the same case
                if (agg.length > 0 && current.actionText === agg[agg.length - 1].actionText) {
                    agg[agg.length - 1].actionLine += current.actionLine;
                } else {
                    agg.push(current)
                }
                return agg;
            },[]).map(({actionLine, actionText}) => actionLine + actionText);

        return {
            stateTypes: types.length > 0 ? types.join('\n'): '',
            stateInitialState: initialState.length > 0 ? initialState.join('\n'): '',
            stateCase: cases.length > 0 ? cases.join('\n'): ''
        };
    }

    private static _createEffect(params: {
        action: string,
        camelCaseName: string;
        capitalizedCamelCaseName: string;
        upperCaseActionName: string;
        nameWithDashes: string;
        route: string;
    }) : string {
        let effectToReturn = '';
        switch (params.action) {
            case 'get':
                // listen to the router
                effectToReturn += `${indentation}@Effect()\n`;
                effectToReturn += `${indentation}navigateTo${params.capitalizedCamelCaseName}: Observable<Action> = RouterUtilsService.handleNavigationWithParams(\n`;
                effectToReturn += `${indentation.repeat(2)}['${params.route ? params.route + '/' : ''}${params.nameWithDashes}/:id'],this.actions$).pipe(\n`;
                effectToReturn += `${indentation.repeat(3)}map((result: RouteNavigationParams) => {\n`;
                effectToReturn += `${indentation.repeat(4)}return {\n`;
                effectToReturn += `${indentation.repeat(5)}type: ${params.capitalizedCamelCaseName}Actions.ROUTER_${params.upperCaseActionName},\n`;
                effectToReturn += `${indentation.repeat(5)}payload: +result.params.id\n`;
                effectToReturn += `${indentation.repeat(4)}}\n`;
                effectToReturn += `${indentation.repeat(3)}})\n`;
                effectToReturn += `${indentation.repeat(2)});\n`;
                // listen to the actions
                effectToReturn += `${indentation}@Effect()\n`;
                effectToReturn += `${indentation}${params.action}${params.capitalizedCamelCaseName}: Observable<Action> = NgrxUtilsService.actionToServiceToAction({\n`;
                effectToReturn += `${indentation.repeat(2)}actionsObs: this.actions$,\n`;
                effectToReturn += `${indentation.repeat(2)}actionsToListenTo: [\n`;
                effectToReturn += `${indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.ROUTER_${params.upperCaseActionName},\n`;
                effectToReturn += `${indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.EFFECT_${params.upperCaseActionName},\n`;
                effectToReturn += `${indentation.repeat(2)}],\n`;
                effectToReturn += `${indentation.repeat(2)}serviceMethod: this.${params.capitalizedCamelCaseName}Service.${params.action}${params.capitalizedCamelCaseName}.bind(this.${params.capitalizedCamelCaseName}Service),\n`;
                effectToReturn += `${indentation}});\n`;
                break;
            case 'list':
                // listen to the router
                effectToReturn += `${indentation}@Effect()\n`;
                effectToReturn += `${indentation}navigateTo${params.capitalizedCamelCaseName}List: Observable<Action> = RouterUtilsService.handleNavigationWithParams(\n`;
                effectToReturn += `${indentation.repeat(2)}['${params.route ? params.route + '/' : ''}${params.nameWithDashes}'],this.actions$).pipe(\n`;
                effectToReturn += `${indentation.repeat(3)}map(() => {\n`;
                effectToReturn += `${indentation.repeat(4)}return {\n`;
                effectToReturn += `${indentation.repeat(5)}type: ${params.capitalizedCamelCaseName}Actions.ROUTER_${params.upperCaseActionName},\n`;
                effectToReturn += `${indentation.repeat(4)}}\n`;
                effectToReturn += `${indentation.repeat(3)}})\n`;
                effectToReturn += `${indentation.repeat(2)});\n`;
                // listen to the actions
                effectToReturn += `${indentation}@Effect()\n`;
                effectToReturn += `${indentation}${params.action}${params.capitalizedCamelCaseName}: Observable<Action> = NgrxUtilsService.actionToServiceToAction({\n`;
                effectToReturn += `${indentation.repeat(2)}actionsObs: this.actions$,\n`;
                effectToReturn += `${indentation.repeat(2)}actionsToListenTo: [\n`;
                effectToReturn += `${indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.PAGE_${params.upperCaseActionName},\n`;
                effectToReturn += `${indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.ROUTER_${params.upperCaseActionName},\n`;
                effectToReturn += `${indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.EFFECT_${params.upperCaseActionName},\n`;
                effectToReturn += `${indentation.repeat(2)}],\n`;
                effectToReturn += `${indentation.repeat(2)}serviceMethod: this.${params.capitalizedCamelCaseName}Service.${params.action}${params.capitalizedCamelCaseName}.bind(this.${params.capitalizedCamelCaseName}Service),\n`;
                effectToReturn += `${indentation}});\n`;
                break;
            case 'delete':
                // listen to the actions
                effectToReturn += `${indentation}@Effect()\n`;
                effectToReturn += `${indentation}${params.action}${params.capitalizedCamelCaseName}: Observable<Action> = NgrxUtilsService.actionToServiceToAction({\n`;
                effectToReturn += `${indentation.repeat(2)}actionsObs: this.actions$,\n`;
                effectToReturn += `${indentation.repeat(2)}store: this.store.pipe(select('${params.camelCaseName}Store')),\n`;
                effectToReturn += `${indentation.repeat(2)}actionsToListenTo: [\n`;
                effectToReturn += `${indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.PAGE_${params.upperCaseActionName},\n`;
                effectToReturn += `${indentation.repeat(2)}],\n`;
                effectToReturn += `${indentation.repeat(2)}serviceMethod: this.${params.capitalizedCamelCaseName}Service.${params.action}${params.capitalizedCamelCaseName}.bind(this.${params.capitalizedCamelCaseName}Service),\n`;
                effectToReturn += `${indentation.repeat(2)}outputTransform: (id: number) => \n`;
                effectToReturn += `${indentation.repeat(3)}this.router.navigate(['/${params.route ? params.route + '/' : ''}${params.nameWithDashes}'])\n`;
                effectToReturn += `${indentation}});\n`;
                // reload and navigate back
                break;
            case 'save':
                // listen to the actions
                effectToReturn += `${indentation}@Effect()\n`;
                effectToReturn += `${indentation}${params.action}{params.capitalizedCamelCaseName}: Observable<Action> = NgrxUtilsService.actionToServiceToAction({\n`;
                effectToReturn += `${indentation.repeat(2)}actionsObs: this.actions$,\n`;
                effectToReturn += `${indentation.repeat(2)}actionsToListenTo: [\n`;
                effectToReturn += `${indentation.repeat(3)}${params.capitalizedCamelCaseName}Actions.PAGE_${params.upperCaseActionName},\n`;
                effectToReturn += `${indentation.repeat(2)}],\n`;
                effectToReturn += `${indentation.repeat(2)}serviceMethod: this.${params.capitalizedCamelCaseName}Service.${params.action}${params.capitalizedCamelCaseName}.bind(this.${params.capitalizedCamelCaseName}Service),\n`;
                effectToReturn += `${indentation.repeat(2)}outputTransform: (id: number) => \n`;
                effectToReturn += `${indentation.repeat(3)}this.router.navigate(['/${params.route ? params.route + '/' : ''}${params.nameWithDashes}', id])\n`;
                effectToReturn += `${indentation}});\n`;
                break;
            default:
                break;
        }

        return effectToReturn;
    }
}