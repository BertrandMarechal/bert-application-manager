import { Tag, DatabaseTableField, DatabaseTable } from './database-file.model';

/*
    ### Fields Tags

    - `#sort` --sorts on this column
    - `#list-filter=<name?>` --generates the list code with a filter on this column
    - `#camel-cased-name=<name!>` --sets the camel cased name
    - `#get-with-parent` --mark the current object as to get when getting the parent object

    ### Table Tags

    actions: save (deals with update and insert), delete, get, list

    - `#ignore` --ignores this entity for file generation
    - `#roles=['<role 1>', '<role 2>']` --roles that can access this resource, overwritten by the action specific tags below
    - `#<action!>-roles=['<role 1>', '<role 2>']` --sets the roles for the specific action
    - `#no-<action!>` --ignores the generation of the file for the specified action
    - `#service-name=<service name>` -- name of the service that will be used for the serverless function
*/
export const actions = [
    'get',
    'list',
    'save',
    'delete',
];
const rolesRegex = /^\[(\'[a-z0-9 ,]+\')(,\'[a-z0-9 ,]+\')*\]$/i;

export interface AvailableTag {
    name: string;
    description: string;
    needsValue?: boolean;
    valueRegex?: RegExp;
}
export const availableTags: {
    table: AvailableTag[];
    field: AvailableTag[];
} = {
    table: [
        {
            name: 'ignore',
            description: 'Ignores the table in function generation'
        },
        ...actions.map(action => ({
            name: `no-${action}`,
            description: `Ignores the table in ${action} function generation`
        })),
        {
            name: 'roles',
            description: `Roles that have access to this entity (format : ['manager','dummy role'])`,
            needsValue: true,
            valueRegex: rolesRegex
        },
        ...actions.map(action => ({
            name: `${action}-roles`,
            description: `Roles that have access to ${action} on this entity (format : ['manager','dummy role'])`,
            needsValue: true,
            valueRegex: rolesRegex
        })),
        {
            name: 'service-name',
            description: 'Name of the middle tier service that will host this function (format: sig-ad)',
            needsValue: true,
            valueRegex: /^[a-z0-9\-]+$/
        },
    ],
    field: [
        {
            name: `sort`,
            description: 'Sorts on this column'
        },
        {
            name: `list-filter`,
            description: 'Generates the list function code with a filter on this column',
            needsValue: true,
            valueRegex: /^[a-z0-9]*$/i
        },
        {
            name: `camel-cased-name`,
            description: 'Sets the camel cased name',
            needsValue: true,
            valueRegex: /^[a-z][a-z0-9]+$/
        },
        {
            name: `get-with-parent`,
            description: 'Mark the current object as to get when getting the parent object'
        },
    ]
};

export const getAvailableTags = (type: string, tags: {[name: string]: Tag}, entity: DatabaseTable | DatabaseTableField): AvailableTag[] => {
    const tagsArray = Object.keys(tags || {}).map(x => tags[x]);
    let availableTagsToReturn: AvailableTag[] = availableTags[type]
        .filter(tag => !tagsArray.find(t => t.name === tag.name));
    // entity specific process
    if (type === 'table') {
        if (tagsArray.find(tag => tag.name === 'roles')) {
            // remove the action specific roles
            availableTagsToReturn = availableTagsToReturn.filter(tag => !/\-roles$/.test(tag.name));
        } else if (tagsArray.filter(tag => /\-roles$/.test(tag.name)).length) {
            // remove the global roles
            availableTagsToReturn = availableTagsToReturn.filter(tag => tag.name !== 'roles');
        }
        if (tagsArray.find(tag => tag.name === 'ignore')) {
            // remove the action specific no
            availableTagsToReturn = availableTagsToReturn.filter(tag => !/^no\-[a-z]+$/.test(tag.name));
        } else if (tagsArray.filter(tag => /^no\-[a-z]+$/.test(tag.name)).length) {
            // remove the global ignore
            availableTagsToReturn = availableTagsToReturn.filter(tag => tag.name !== 'ignore');
        }
    } else if (type === 'field') {
        if (!(entity as DatabaseTableField).isForeignKey) {
            availableTagsToReturn = availableTagsToReturn.filter(tag => tag.name !== 'get-with-parent');
        }
    }
    return availableTagsToReturn;
};
