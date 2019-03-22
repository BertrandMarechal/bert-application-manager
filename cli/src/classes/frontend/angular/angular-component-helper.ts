import { FileAndContent, FileUtils } from '../../../utils/file.utils';
import {FrontendFileHelper} from '../frontend-file-helper';
import path from 'path';
import { indentation, SyntaxUtils } from '../../../utils/syntax.utils';

export type ComponentTypes = 
    | 'default'
    | 'view'
    | 'list'
    | 'details'
    | 'edit'
;

interface AngularComponentParameters {
    type: ComponentTypes;
    path: string;
    nameWithDashes: string;
    camelCasedName: string;
    capitalizedCamelCasedName: string;
    hasList: boolean;
    hasGet: boolean;
    hasSave: boolean;
    hasDelete: boolean;
}

export class AngularComponentHelper {
    static async getComponentFiles(params: AngularComponentParameters): Promise<FileAndContent[]> {        
        switch (params.type) {
            case 'default':
                return await AngularComponentHelper._getDefaultComponent(params);
            default:
                break;
        }
        return [];
    }

    private static async _getDefaultComponent(params: AngularComponentParameters): Promise<FileAndContent[]> {
        let listAction = '';
        let actionImport = '';
        if (params.hasList) {
            actionImport = `import * as ${params.capitalizedCamelCasedName}Actions from '@app/store/actions/${params.nameWithDashes}.actions';`

            listAction = `${indentation}onList(event: DatabasePaginationInput) {\n;`;
            listAction += `${indentation.repeat(2)}this.store.dispatch(new AdminActions.PageGetContractPersonsAction(event));\n`
            listAction += `${indentation}}`;
        }
        const defaultComponentTs = await FileUtils.readFile(
            path.resolve(
                FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'default', `default${params.hasList ? '-list' : ''}.component.ts`
            )
        );
        const defaultComponentHtml = await FileUtils.readFile(
            path.resolve(
                FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'default', `default${params.hasGet ? '-get' : ''}${params.hasList ? '-list' : ''}.component.html`
            )
        );
        return [{
            fileContent: defaultComponentTs
            .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
            .replace(/<name_with_dashes>/g, params.nameWithDashes)
            .replace(/<camel_cased_name>/g, params.camelCasedName)
            .replace(/<list_action>/g, listAction)
            .replace(/<action_import>/g, actionImport),
            path: `${params.path}.ts`,
        }, {
            fileContent: defaultComponentHtml
            .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
            .replace(/<camel_cased_name>/g, params.camelCasedName)
            .replace(/<can_save_true_false>/g, params.hasSave ? 'true' : 'false')
            .replace(/<title_case_name>/g, SyntaxUtils.camelCaseToTitleCase(params.capitalizedCamelCasedName)),
            path: `${params.path}.html`,
        }];
    }
}