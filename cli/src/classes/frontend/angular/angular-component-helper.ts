import { FileAndContent, FileUtils } from '../../../utils/file.utils';
import { FrontendFileHelper } from '../frontend-file-helper';
import path from 'path';
import { indentation, SyntaxUtils } from '../../../utils/syntax.utils';
import { DatabaseTableField } from '../../../models/database-file.model';

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
    fields: DatabaseTableField[];
}

export class AngularComponentHelper {
    static async getComponentFiles(params: AngularComponentParameters): Promise<FileAndContent[]> {
        switch (params.type) {
            case 'default':
                return await AngularComponentHelper._getDefaultComponent(params);
            case 'details':
                return await AngularComponentHelper._getDetailsComponent(params);
            case 'edit':
                return await AngularComponentHelper._getEditComponent(params);
            case 'view':
                return await AngularComponentHelper._geViewComponent(params);
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

    private static async _geViewComponent(params: AngularComponentParameters): Promise<FileAndContent[]> {
        const viewComponentTs = await FileUtils.readFile(
            path.resolve(
                FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'view', `view.component.ts`
            )
        );
        const viewComponentHtml = await FileUtils.readFile(
            path.resolve(
                FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'view', `view.component.html`
            )
        );

        return [{
            fileContent: viewComponentTs
                .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                .replace(/<name_with_dashes>/g, params.nameWithDashes)
                .replace(/<camel_cased_name>/g, params.camelCasedName),
            path: `${params.path}.ts`,
        }, {
            fileContent: viewComponentHtml.replace(/<camel_cased_name>/g, params.camelCasedName),
            path: `${params.path}.html`,
        }];
    }

    private static async _getDetailsComponent(params: AngularComponentParameters): Promise<FileAndContent[]> {
        const detailsComponentTs = await FileUtils.readFile(
            path.resolve(
                FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'details', `details.component.ts`
            )
        );
        const detailsComponentHtml = await FileUtils.readFile(
            path.resolve(
                FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'details', `details.component.html`
            )
        );

        const detailsFields = params.fields
            .filter(field => !field.tags['not-for-details'] &&
                (['modifiedAt', 'modifiedBy', 'createdAt', 'createdBy'].indexOf(field.camelCasedName) === -1 || field.tags['for-details']))
            .map(field => {

                let toReturn = `${indentation.repeat(4)}{\n`;
                toReturn += `${indentation.repeat(5)}name: '${SyntaxUtils.camelCaseToTitleCase(field.camelCasedName)}',\n`;
                toReturn += `${indentation.repeat(5)}key: '${field.camelCasedName}',\n`;
                switch (field.type.toLowerCase()) {
                    case 'boolean':
                        toReturn += `${indentation.repeat(5)}booleanFalseValue: 'False',\n`;
                        toReturn += `${indentation.repeat(5)}booleanTrueValue: 'False',\n`;
                        toReturn += `${indentation.repeat(5)}type: 'boolean',\n`;
                        break;
                    case 'date':
                        toReturn += `${indentation.repeat(5)}type: 'date',\n`;
                        break;
                    default:
                        break;
                }
                toReturn += `${indentation.repeat(4)})`;
                return toReturn;
            }).join(',\n');
        return [{
            fileContent: detailsComponentTs
                .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                .replace(/<name_with_dashes>/g, params.nameWithDashes)
                .replace(/<camel_cased_name>/g, params.camelCasedName)
                .replace(/<fields_details>/g, detailsFields),
            path: `${params.path}.ts`,
        }, {
            fileContent: detailsComponentHtml.replace(/<camel_cased_name>/g, params.camelCasedName),
            path: `${params.path}.html`,
        }];
    }

    private static async _getEditComponent(params: AngularComponentParameters): Promise<FileAndContent[]> {
        const editComponentTs = await FileUtils.readFile(
            path.resolve(
                FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'edit', `edit.component.ts`
            )
        );
        const editComponentHtml = await FileUtils.readFile(
            path.resolve(
                FrontendFileHelper.frontendTemplatesFolder, 'angular', 'components', 'edit', `edit.component.html`
            )
        );

        const editFormFields = params.fields
            .filter(field => (field.toUpdate ||
                field.camelCasedName === 'id') &&
                ['modifiedAt', 'modifiedBy', 'createdAt', 'createdBy'].indexOf(field.camelCasedName) === -1)
            .map(field => {
                if (field.camelCasedName === 'id') {
                    return `${indentation.repeat(3)}'id': new FormControl(this.${params.camelCasedName}.id)`;
                } else {
                    let toReturn = `${indentation.repeat(3)}'${field.camelCasedName}': new FormControl(this.${params.camelCasedName}.${field.camelCasedName}`;
                    if (field.notNull) {
                        toReturn += ', Validators.required';
                    }
                    toReturn += ')';
                    return toReturn;
                }
            }).join(',\n');
        const htmlFormFields = params.fields
            .filter(field => (field.toUpdate ||
                field.camelCasedName === 'id') &&
                ['modifiedAt', 'modifiedBy', 'createdAt', 'createdBy'].indexOf(field.camelCasedName) === -1)
            .map(field => {
                if (field.camelCasedName === 'id') {
                    return `${indentation}<input type="hidden" formControlName="id">`;
                } else {
                    return `${indentation}<mat-form-field>\n` +
                        `${indentation.repeat(2)}<input matInput placeholder="${SyntaxUtils.camelCaseToTitleCase(params.camelCasedName)}" formControlName="${params.camelCasedName}">` +
                        `${indentation}</mat-form-field>`;
                }
            }).join('\n<br>\n');
        return [{
            fileContent: editComponentTs
                .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                .replace(/<name_with_dashes>/g, params.nameWithDashes)
                .replace(/<camel_cased_name>/g, params.camelCasedName)
                .replace(/<form_controls>/g, editFormFields),
            path: `${params.path}.ts`,
        }, {
            fileContent: editComponentHtml
                .replace(/<capitalized_camel_cased_name>/g, params.capitalizedCamelCasedName)
                .replace(/<camel_cased_name>/g, params.camelCasedName)
                .replace(/<html_form_fields>/g, htmlFormFields),
            path: `${params.path}.html`,
        }];
    }
}