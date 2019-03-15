import {indentation, SyntaxUtils} from '../../../utils/syntax.utils';


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
    static createReducers(params: {
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

    static createEffect(params: {
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

    
    static createActions(params: {
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