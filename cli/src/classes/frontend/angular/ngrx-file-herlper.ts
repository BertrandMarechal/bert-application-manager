import { indentation, SyntaxUtils } from '../../../utils/syntax.utils';
import { FileAndContent, FileUtils } from '../../../utils/file.utils';
import path from 'path';
import { FrontendFileHelper } from '../frontend-file-helper';

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

export class NgrxFileHelper {
    actionsFile: FileAndContent;
    reducersFile: FileAndContent;
    effectsFile: FileAndContent;
    actions: {
        names: string;
        classes: string;
        types: string;
    }[];

    reducers: {
        stateTypes: string;
        stateInitialState: string;
        stateCase: string;
    }[];

    effects: string[];
    params: {
        frontendPath: string;
        nameWithDashes: string;
        upperCaseObjectName: string;
        capitalizedCamelCasedName: string;
        camelCasedName: string;
        nameWithoutPrefixAndSuffix: string;
    };

    constructor() {
        this.actionsFile = {
            path: '',
            fileContent: ''
        };
        this.reducersFile = {
            path: '',
            fileContent: ''
        };
        this.effectsFile = {
            path: '',
            fileContent: ''
        };
        this.actions = [];
        this.reducers = [];
        this.effects = [];

        this.params = {
            frontendPath: '',
            nameWithDashes: '',
            upperCaseObjectName: '',
            capitalizedCamelCasedName: '',
            camelCasedName: '',
            nameWithoutPrefixAndSuffix: '',
        };
    }
    async init(params: {
        frontendPath: string;
        nameWithDashes: string;
        upperCaseObjectName: string;
        capitalizedCamelCasedName: string;
        camelCasedName: string;
        nameWithoutPrefixAndSuffix: string;
    }) {
        this.params = params;
        const ngrxActionsFileTemplate = await FileUtils.readFile(path.resolve(FrontendFileHelper.frontendTemplatesFolder, 'angular', 'ngrx', 'ngrx-actions.ts'));
        const ngrxReducersFileTemplate = await FileUtils.readFile(path.resolve(FrontendFileHelper.frontendTemplatesFolder, 'angular', 'ngrx', 'ngrx-reducers.ts'));
        const ngrxEffectsFileTemplate = await FileUtils.readFile(path.resolve(FrontendFileHelper.frontendTemplatesFolder, 'angular', 'ngrx', 'ngrx-effects.ts'));

        this.actionsFile = {
            path: path.resolve(params.frontendPath, 'src', 'app', 'store', 'actions', `${params.nameWithDashes}.actions.ts`),
            fileContent: ngrxActionsFileTemplate
        };
        this.reducersFile = {
            path: path.resolve(params.frontendPath, 'src', 'app', 'store', 'reducers', `${params.nameWithDashes}.reducers.ts`),
            fileContent: ngrxReducersFileTemplate
        };
        this.effectsFile = {
            path: path.resolve(params.frontendPath, 'src', 'app', 'store', 'effects', `${params.nameWithDashes}.effects.ts`),
            fileContent: ngrxEffectsFileTemplate
        };
        this.actions = [];
        this.reducers = [];
        this.effects = [];
    }

    addAction(params: {
        action: string;
        upperCaseActionName: string;
        capitalizedActionName: string;
    }) {

        this.actions.push(NgrxFileHelper._createActions({
            action: params.action,
            upperCaseObjectName: this.params.upperCaseObjectName,
            upperCaseActionName: params.upperCaseActionName,
            capitalizedActionName: params.capitalizedActionName,
            capitalizedCamelCasedName: this.params.capitalizedCamelCasedName,
        }));

        this.reducers.push(NgrxFileHelper._createReducers({
            action: params.action,
            camelCaseName: this.params.camelCasedName,
            capitalizedCamelCaseName: this.params.capitalizedCamelCasedName,
            upperCaseActionName: params.upperCaseActionName,
        }));

        this.effects.push(NgrxFileHelper._createEffect({
            action: params.action,
            camelCaseName: this.params.camelCasedName,
            capitalizedCamelCaseName: this.params.capitalizedCamelCasedName,
            upperCaseActionName: params.upperCaseActionName,
            nameWithDashes: this.params.nameWithDashes,
            route: ''
        }));
    }

    getFiles(): FileAndContent[] {
        const toReturn: FileAndContent[] = [];
        if (this.actions.length) {
            this.actionsFile.fileContent
                .replace(/<snake_case_actions_upper_case>/g, this.params.nameWithoutPrefixAndSuffix.toUpperCase())
                .replace(/<snake_case_actions_lower_case>/g, this.params.nameWithoutPrefixAndSuffix.toLowerCase())
                .replace(/<capitalized_camel_cased_name>/g, this.params.capitalizedCamelCasedName)
                .replace(/<action_names>/,this.actions.map(x => x.names).join('\n\n'))
                .replace(/<action_classes>/,this.actions.map(x => x.classes).join('\n\n'))
                .replace(/<action_types>/,this.actions.map(x => x.types).join('\n\n'));
            toReturn.push(this.actionsFile);
        }
        if (this.reducers.length) {
            this.reducersFile.fileContent
                .replace(/<capitalized_camel_cased_name>/g, this.params.capitalizedCamelCasedName)
                .replace(/<name_with_dashes>/g, this.params.nameWithDashes)
                .replace(/<camel_cased_name>/g, this.params.camelCasedName)
                .replace(/<types>/,this.reducers.map(x => x.stateTypes).filter(Boolean).join('\n'))
                .replace(/<initial_state>/,this.reducers.map(x => x.stateInitialState).filter(Boolean).join('\n'))
                .replace(/<cases>/,this.reducers.map(x => x.stateCase).filter(Boolean).join('\n'));
            toReturn.push(this.reducersFile);
        }

        if (this.effects.length) {
            this.effectsFile.fileContent
                .replace(/<name_with_dashes>/g, this.params.nameWithDashes)
                .replace(/<camel_cased_name>/g, this.params.camelCasedName)
                .replace(/<capitalized_camel_cased_name>/g, this.params.capitalizedCamelCasedName)
                .replace(/<effects>/,this.effects.join('\n'));
            toReturn.push(this.effectsFile);
        }
        return toReturn;
    }

    static _createReducers(params: {
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
                return { actionLine, actionText: toReturn };
            })
            .reduce((agg: { actionLine: string, actionText: string }[], current) => {
                // we add the similar actions to the same case
                if (agg.length > 0 && current.actionText === agg[agg.length - 1].actionText) {
                    agg[agg.length - 1].actionLine += current.actionLine;
                } else {
                    agg.push(current)
                }
                return agg;
            }, []).map(({ actionLine, actionText }) => actionLine + actionText);

        return {
            stateTypes: types.length > 0 ? types.join('\n') : '',
            stateInitialState: initialState.length > 0 ? initialState.join('\n') : '',
            stateCase: cases.length > 0 ? cases.join('\n') : ''
        };
    }

    static _createEffect(params: {
        action: string,
        camelCaseName: string;
        capitalizedCamelCaseName: string;
        upperCaseActionName: string;
        nameWithDashes: string;
        route: string;
    }): string {
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


    static _createActions(params: {
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
}