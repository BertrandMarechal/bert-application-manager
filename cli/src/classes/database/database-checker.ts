import { UiUtils } from '../../utils/ui.utils';
import { RepositoryUtils } from '../../utils/repository.utils';
import { DatabaseHelper } from './database-helper';
import { DatabaseTagger } from './database-tagger';
import { DatabaseRepositoryReader } from './database-repo-reader';
import colors from 'colors';
import path from 'path';
import { DatabaseSubObject, DatabaseObject, DatabaseTable, DatabaseTableField, DatabaseFileType } from '../../models/database-file.model';
import { FileUtils } from '../../utils/file.utils';
import { DatabaseFileHelper } from './database-file-helper';

type ObjectIssueTyes = 'incorrect-name' | 'incorrect-fk' | 'incorrect-fk-name' | 'not-fk' | 'no-index-on-local-replicated-table';

interface ObjectWithIssue {
    objectType: DatabaseFileType;
    objectName: string;
    fieldName?: string;
    expected?: string;
    issueType: ObjectIssueTyes;
    fileName: string;
    usefulData?: any;
}

export class DatabaseChecker {
    private static _origin = 'DatabaseChecker';
    static async checkCode(params: {
        applicationName: string;
        fix?: boolean;
    }, uiUtils: UiUtils) {
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);

        // get the db as object to get the params
        let databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        await RepositoryUtils.readRepository({
            startPath: databaseObject._properties.path,
            type: "postgres"
        }, uiUtils);
        databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);

        // get the application and its versions
        let databaseData = await DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
        if (!databaseData || !databaseObject) {
            throw 'Invalid application name. Please run the "am repo read" command in the desired folder beforehand.';
        }

        const objectsWithIssue: ObjectWithIssue[] = [];
        const filesToAnalyzeLength =
            Object.keys(databaseObject.table).length +
            Object.keys(databaseObject.function).length +
            Object.keys(databaseObject.data).length +
            Object.keys(databaseObject['local-tables']).length;
        if (filesToAnalyzeLength > 0) {
            let i = 0;
            if (Object.keys(databaseObject.table).length > 0) {
                const keys = Object.keys(databaseObject.table);
                for (let j = 0; j < keys.length; j++) {
                    uiUtils.progress(++i);
                    const key = keys[j];
                    if (databaseObject.table[key].name !== key) {
                        // the name of the object is not the same as the file name, we have to report that
                        objectsWithIssue.push({
                            objectName: databaseObject.table[key].name,
                            fileName: key,
                            objectType: 'table',
                            issueType: 'incorrect-name',
                        });
                    }
                    // check that the files columns are named correctly (foreign keys are prefixed "fk_")
                    const fieldKeys = Object.keys(databaseObject.table[key].fields);
                    for (let k = 0; k < fieldKeys.length; k++) {
                        const field = databaseObject.table[key].fields[fieldKeys[k]];
                        if (field.isForeignKey) {
                            if (field.foreignKey && !field.tags['ignore-for-fk-check']) {
                                const foreignKeyTableSuffix = (databaseObject.table[field.foreignKey.table] || databaseObject['local-tables'][field.foreignKey.table]).tableSuffix;
                                if (field.name.indexOf('fk_') !== 0) {
                                    objectsWithIssue.push({
                                        objectName: databaseObject.table[key].name,
                                        fileName: key,
                                        fieldName: field.name,
                                        expected: `fk_${foreignKeyTableSuffix}_${databaseObject.table[key].tableSuffix}_`,
                                        objectType: 'table',
                                        issueType: 'incorrect-fk-name',
                                    });
                                } else if (!field.name.match(new RegExp(`fk\_${foreignKeyTableSuffix}\_${databaseObject.table[key].tableSuffix}\_[a-z0-9_]+`))) {
                                    objectsWithIssue.push({
                                        objectName: databaseObject.table[key].name,
                                        fileName: key,
                                        fieldName: field.name,
                                        expected: `fk_${foreignKeyTableSuffix}_${databaseObject.table[key].tableSuffix}_`,
                                        objectType: 'table',
                                        issueType: 'incorrect-fk-name',
                                    });
                                }
                            }
                        } else if (field.name.indexOf('fk_') === 0) {
                            if (!field.tags['ignore-for-fk-check']) {
                                objectsWithIssue.push({
                                    objectName: databaseObject.table[key].name,
                                    fileName: key,
                                    fieldName: field.name,
                                    expected: `${databaseObject.table[key].tableSuffix}_*`,
                                    objectType: 'table',
                                    issueType: 'not-fk',
                                });
                            }
                        }
                    }
                }
            }
            if (Object.keys(databaseObject.function).length > 0) {
                const keys = Object.keys(databaseObject.function);
                for (let j = 0; j < keys.length; j++) {
                    uiUtils.progress(++i);
                    const key = keys[j];
                    if (databaseObject.function[key].name !== key) {
                        // the name of the object is not the same as the file name, we have to report that
                        objectsWithIssue.push({
                            objectName: databaseObject.function[key].name,
                            fileName: key,
                            objectType: 'function',
                            issueType: 'incorrect-name'
                        });
                    }
                }
            }
            if (Object.keys(databaseObject['local-tables']).length > 0) {
                const keys = Object.keys(databaseObject['local-tables']);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    // check that the column named 'pk_*' is unique or primary key
                    const fileString = await FileUtils.readFile(databaseObject['local-tables'][key].latestFile);
                    const matched = fileString.match(/\W(pk_[a-z0-9]{3}_id)\W([^,]+),/i);
                    if (matched) {
                        const restOfTheCode = matched[2].toLowerCase();
                        if (restOfTheCode.indexOf('primary key') === -1 && restOfTheCode.indexOf('unique') === -1) {
                            objectsWithIssue.push({
                                objectName: key,
                                fileName: key,
                                fieldName: matched[1].toLowerCase(),
                                objectType: 'local-tables',
                                issueType: 'no-index-on-local-replicated-table',
                                usefulData: {
                                    fullFieldText: matched[0]
                                }
                            });
                        }
                    }
                }
            }
            uiUtils.stoprProgress();

            objectsWithIssue.sort((a, b) => {
                if (a.issueType < b.issueType) {
                    return -1;
                } else if (a.issueType > b.issueType) {
                    return 1;
                }
                return 0;
            })
            if (objectsWithIssue.length > 0) {
                if (objectsWithIssue.length > 0) {
                    for (let i = 0; i < objectsWithIssue.length; i++) {
                        const objectWithIssue = objectsWithIssue[i];
                        if (objectWithIssue.issueType === 'incorrect-name') {
                            uiUtils.warning({
                                origin: DatabaseChecker._origin,
                                message: `   - ${objectWithIssue.objectType} "${colors.yellow(objectWithIssue.fileName)}" is actually named "${colors.green(objectWithIssue.objectName)}"`
                            });
                        } else if (objectWithIssue.issueType === 'incorrect-fk-name') {
                            uiUtils.warning({
                                origin: DatabaseChecker._origin,
                                message: `   - ${objectWithIssue.objectType} "${objectWithIssue.fileName}"."${colors.yellow(objectWithIssue.fieldName as string)}" was expected to be called ${colors.green(objectWithIssue.expected as string)}*`
                            });
                        } else if (objectWithIssue.issueType === 'not-fk') {
                            uiUtils.warning({
                                origin: DatabaseChecker._origin,
                                message: `   - ${objectWithIssue.objectType} "${objectWithIssue.fileName}"."${colors.yellow(objectWithIssue.fieldName as string)}" does not seem to be a foreign key, and yet is prefixed "fk"`
                            });
                        } else if (objectWithIssue.issueType === 'no-index-on-local-replicated-table') {
                            uiUtils.warning({
                                origin: DatabaseChecker._origin,
                                message: `   - ${objectWithIssue.objectType} "${objectWithIssue.fileName}"."${colors.yellow(objectWithIssue.fieldName as string)}" does not have an index defined on it`
                            });
                        }
                    }
                }

                let fix = params.fix || (await uiUtils.question({
                    origin: DatabaseChecker._origin,
                    text: `Do you want to fix the file issues above ? (y/N)`
                })).toLowerCase() === 'y';

                if (fix) {
                    uiUtils.info({
                        origin: DatabaseChecker._origin,
                        message: `Fixing...`
                    });

                    // check if we have files to rename only, or more
                    const objectsWithFileNameIssue = objectsWithIssue.filter(x => x.issueType === 'incorrect-name');
                    let rerunAfterUpdateNames = objectsWithFileNameIssue.length && objectsWithFileNameIssue.length < objectsWithIssue.length;
                    if (objectsWithFileNameIssue.length) {
                        if (rerunAfterUpdateNames) {
                            uiUtils.warning({
                                origin: DatabaseChecker._origin,
                                message: `We found objects with incorrect name. we will run those fixes, and rerun the check afterwhile to fix the rest`
                            });
                        }
                        for (let i = 0; i < objectsWithFileNameIssue.length; i++) {
                            const objectWithFileNameIssue = objectsWithFileNameIssue[i];
                            await this.fixFileNameIssue(objectWithFileNameIssue, databaseObject, uiUtils);
                        }
                    } else {
                        // we first process 'incorrect-fk-name'
                        let objectsToProcess = objectsWithIssue.filter(x => x.issueType === 'incorrect-fk-name');
                        if (objectsToProcess.length) {
                            for (let i = 0; i < objectsToProcess.length; i++) {
                                const objectToProcess = objectsToProcess[i];
                                await this.fixForeignKeyNameIssue(objectToProcess, databaseObject, params, uiUtils);
                            }
                        }
                        objectsToProcess = objectsWithIssue.filter(x => x.issueType === 'not-fk');
                        if (objectsToProcess.length) {
                            for (let i = 0; i < objectsToProcess.length; i++) {
                                const objectToProcess = objectsToProcess[i];
                                await this.fixNotFkIssue(objectToProcess, databaseObject, params, uiUtils);
                            }
                        }
                        objectsToProcess = objectsWithIssue.filter(x => x.issueType === 'no-index-on-local-replicated-table');
                        if (objectsToProcess.length) {
                            for (let i = 0; i < objectsToProcess.length; i++) {
                                const objectToProcess = objectsToProcess[i];
                                await this.fixNotIndexOnLocalReplicatedTableIssue(objectToProcess, databaseObject, params, uiUtils);
                            }
                        }
                    }
                    uiUtils.success({
                        origin: DatabaseChecker._origin,
                        message: `Fixed`
                    });
                    if (rerunAfterUpdateNames) {
                        await this.checkCode({ ...params, fix: true }, uiUtils);
                    } else {
                        await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                    }
                }
            } else {
                uiUtils.success({
                    origin: DatabaseChecker._origin,
                    message: `Checked ${filesToAnalyzeLength} files - The files are looking all good.`
                });
            }
        }
    }

    private static async fixNotIndexOnLocalReplicatedTableIssue(objectWithIssue: ObjectWithIssue, databaseObject: DatabaseObject, params: { applicationName: string }, uiUtils: UiUtils) {
        uiUtils.info({
            origin: DatabaseChecker._origin,
            message: `Dealing with ${colors.green(objectWithIssue.objectName)}.${colors.green(objectWithIssue.fieldName || '')}`
        });
        // - Create the new table script, and the alter table script
        try {
            await DatabaseFileHelper.editObject({
                applicationName: params.applicationName,
                objectName: objectWithIssue.objectName,
                objectType: 'local-table'
            }, uiUtils);
        }
        catch (e) {
            uiUtils.info({
                origin: this._origin,
                message: e
            });
        }
        const usefulData = objectWithIssue.usefulData || { fullFieldText: '' };

        uiUtils.info({
            origin: this._origin,
            message: `Updating ${objectWithIssue.objectName} script`
        });
        FileUtils.writeFileSync(
            databaseObject.table[objectWithIssue.objectName].latestFile,
            (await FileUtils.readFile(databaseObject.table[objectWithIssue.objectName].latestFile))
                .replace(usefulData.fullFieldText, usefulData.fullFieldText.replace(/([,)])$/, ` UNIQUE \$1`))
        );

        // - update the alter script, and add the alter table add the constraint
        const newRenameScript = `ALTER TABLE ${objectWithIssue.objectName} ADD CONSTRAINT ${objectWithIssue.objectName}_${objectWithIssue.fieldName}_uniq UNIQUE (${objectWithIssue.fieldName});`;
        const currentAlterScriptPath = path.resolve(databaseObject._properties.path, 'postgres', 'release', 'current', 'scripts', `alter_${objectWithIssue.objectName}.sql`);
        let currentAlterScript = await FileUtils.readFile(currentAlterScriptPath);
        if (currentAlterScript) {
            currentAlterScript += '\r\n';
        }
        currentAlterScript += newRenameScript;

        uiUtils.info({
            origin: this._origin,
            message: `Updating ${objectWithIssue.objectName} alter script`
        });
        await FileUtils.writeFileSync(
            currentAlterScriptPath,
            currentAlterScript
        );
        await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
    }
    private static async fixNotFkIssue(objectWithIssue: ObjectWithIssue, databaseObject: DatabaseObject, params: { applicationName: string }, uiUtils: UiUtils) {
        uiUtils.info({
            origin: DatabaseChecker._origin,
            message: `Dealing with ${colors.green(objectWithIssue.objectName)}.${colors.green(objectWithIssue.fieldName || '')}`
        });
        let fieldName = objectWithIssue.fieldName || '';
        let newFieldName = fieldName;
        let [, targetTableSuffix, sourceTableSuffix] = ['', '', ''];
        const matched = fieldName.match(/^fk_([a-z0-9]{3})_([a-z0-9]{3})_/i);
        if (matched) {
            [, targetTableSuffix, sourceTableSuffix] = matched;
        }

        const choice = await uiUtils.choices({
            title: 'choice',
            choices: [
                'Ignore for this run',
                `Set up fk...`,
                `Remove "fk" prefix`,
                'Ignore for next runs',
            ],
            message: ` - What do you want to do for this field (${colors.green(objectWithIssue.objectName)}.${colors.green(objectWithIssue.fieldName || '')}) ?`
        });
        switch (choice['choice']) {
            case 'Ignore for this run':
                return;
            case 'Set up fk...':
                // first check that the second table suffix is the one of the current table
                if (sourceTableSuffix !== databaseObject.table[objectWithIssue.objectName].tableSuffix) {
                    uiUtils.warning({
                        origin: DatabaseChecker._origin,
                        message: `The current field name does not map to this table - we will update the name to `
                    });
                    newFieldName = fieldName.replace(/^(fk_[a-z0-9]{3}_)([a-z0-9]{3})(_.*?)/i, `\$1${databaseObject.table[objectWithIssue.objectName].tableSuffix}\$3`);
                }
                // - Create the new table script, and the alter table script
                try {
                    await DatabaseFileHelper.editObject({
                        applicationName: params.applicationName,
                        objectName: objectWithIssue.objectName,
                        objectType: 'table'
                    }, uiUtils);
                }
                catch (e) {
                    uiUtils.info({
                        origin: this._origin,
                        message: e
                    });
                }
                // check that we have a table with the correct suffix
                let targetTableName = '';
                const tableNames = Object.keys(databaseObject.table);
                for (let i = 0; i < tableNames.length && !targetTableName; i++) {
                    const tableName = tableNames[i];
                    if (databaseObject.table[tableName].tableSuffix === targetTableSuffix) {
                        targetTableName = tableName;
                    }
                }
                let lookForTableText = 'Please tell us which table you want to link this field to';
                if (targetTableName) {
                    // we are going to make sure the table we found is the one the user wants to create the FK for
                    const response = await uiUtils.choices({
                        title: `Link to ${targetTableName}`,
                        message: `Is ${targetTableName} the table you want to create the link for ${fieldName} ?`,
                        choices: ['Yes', 'No']
                    });
                    if (response[`Link to ${targetTableName}`] === 'No') {
                        targetTableName = '';
                        lookForTableText += ' then';
                    }
                }
                if (!targetTableName) {
                    // if not, ask which one we have to select
                    while (!targetTableName) {
                        const response = await uiUtils.question({
                            origin: DatabaseChecker._origin,
                            text: lookForTableText
                        });
                        try {
                            const databaseSubObject: DatabaseTable =
                                (await DatabaseHelper.getDatabaseSubObject({
                                    ...params,
                                    objectName: response,
                                    objectType: 'table'
                                }, databaseObject, DatabaseChecker._origin, uiUtils)) as DatabaseTable;
                            targetTableName = databaseSubObject.name;
                        } catch (error) {
                            await uiUtils.error({
                                origin: DatabaseChecker._origin,
                                message: `Could not find an object with ${response} - please retry`
                            });
                        }
                    }
                }
                // when we know which table to link, create the fk
                // - check whichif the field name is the one we expect
                if (fieldName.toLowerCase().indexOf(`fk_${targetTableSuffix}_${databaseObject.table[targetTableName].tableSuffix}`) !== 0) {
                    uiUtils.warning({
                        origin: DatabaseChecker._origin,
                        message: `The current field name does not map to this table - we will update the name to `
                    });
                    newFieldName = fieldName.replace(/^(fk_)[a-z0-9]{3}_([a-z0-9]{3})(_.*?)/i, `\$1${targetTableSuffix}_${databaseObject.table[targetTableName].tableSuffix}_${databaseObject.table[objectWithIssue.objectName].tableSuffix}\$3`);
                }
                // - rename the field if needed
                if (newFieldName !== fieldName) {
                    await DatabaseFileHelper.renameTableField({
                        applicationName: params.applicationName,
                        fieldName,
                        newName: newFieldName,
                        objectName: objectWithIssue.objectName
                    }, uiUtils);
                }
                // - update the current table script, and add the reference
                const currentFileString = await FileUtils.readFile(databaseObject.table[objectWithIssue.objectName].latestFile);
                let primaryKeyString = '';
                if (databaseObject.table[targetTableName].primaryKey) {
                    primaryKeyString = (databaseObject.table[targetTableName].primaryKey as DatabaseTableField).name;
                }
                const fieldSettingsRegex = '+([^(),]+\\([^,]\\)|[^(),]+)(\\([^()]+\\))?[^(),\\/*]*(\\/\\*[^\\/*]+\\*\\/)?([,)])';
                currentFileString.replace(new RegExp(`${newFieldName} ${fieldSettingsRegex}`, 'i'), `${newFieldName} \$1 REFERENCES ${targetTableName}(${primaryKeyString}) \$3\$4`);

                databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);

                uiUtils.info({
                    origin: this._origin,
                    message: `Updating ${objectWithIssue.objectName} script`
                });
                FileUtils.writeFileSync(
                    databaseObject.table[objectWithIssue.objectName].latestFile,
                    currentFileString
                );

                // - update the alter script, and add the alter table add constraint
                const newRenameScript = `ALTER TABLE ${objectWithIssue.objectName} ADD CONSTRAINT ${objectWithIssue.objectName}_${newFieldName} FOREIGN KEY (${newFieldName}) REFERENCES ${targetTableName} (${primaryKeyString});`;
                const currentAlterScriptPath = path.resolve(databaseObject._properties.path, 'postgres', 'release', 'current', 'scripts', `alter_${objectWithIssue.objectName}.sql`);
                let currentAlterScript = await FileUtils.readFile(currentAlterScriptPath);
                if (currentAlterScript) {
                    currentAlterScript += '\r\n';
                }
                currentAlterScript += newRenameScript;

                uiUtils.info({
                    origin: this._origin,
                    message: `Updating ${objectWithIssue.objectName} alter script`
                });
                await FileUtils.writeFileSync(
                    currentAlterScriptPath,
                    currentAlterScript
                );
                await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);

                break;
            case 'Remove "fk" prefix':
                await DatabaseFileHelper.renameTableField({
                    applicationName: params.applicationName,
                    fieldName,
                    newName: fieldName.replace(
                        new RegExp(`^fk_[a-z0-9]{3}_${databaseObject.table[objectWithIssue.objectName].tableSuffix}_`, 'i'),
                        databaseObject.table[objectWithIssue.objectName].tableSuffix
                    ),
                    objectName: objectWithIssue.objectName
                }, uiUtils);
                break;
            case 'Ignore for next runs':
                await DatabaseTagger.addTagOnField({
                    applicationName: params.applicationName,
                    objectName: objectWithIssue.objectName,
                    fieldName: fieldName,
                    tagName: 'ignore-for-fk-check',
                    tagValue: '',
                }, uiUtils);
                break;
            default:
                break;
        }
        databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
    }

    private static async fixForeignKeyNameIssue(objectWithIssue: ObjectWithIssue, databaseObject: DatabaseObject, params: { applicationName: string }, uiUtils: UiUtils) {
        let fieldName = objectWithIssue.fieldName || '';
        let expected = objectWithIssue.expected || '';
        let correctName = '';
        if (fieldName.match(new RegExp(`^fk_[a-z0-9]{3}\_[a-z0-9]{3}\_`, 'i'))) {
            // we have a correct structure, just not correctly used
            correctName = fieldName.replace(new RegExp(`^fk_[a-z0-9]{3}\_[a-z0-9]{3}\_`, 'i'), expected);
        } else if (fieldName.match(new RegExp(`[^a-z0-9]fk_[a-z0-9]{3}\_[a-z0-9]{3}\_`, 'i'))) {
            // something exists in front of thisthe fk prefix, for reasons unknown
            correctName = fieldName.replace(new RegExp(`^(.*?)fk_[a-z0-9]{3}\_[a-z0-9]{3}\_`, 'i'), expected);
        } else if (fieldName.match(new RegExp(`^${databaseObject.table[objectWithIssue.objectName].tableSuffix}_`, 'i'))) {
            // we created the fk not puting fk in front of the field
            correctName = fieldName.replace(new RegExp(`^${databaseObject.table[objectWithIssue.objectName].tableSuffix}_`, 'i'), expected);
        }
        let choice: { [name: string]: string } = { choice: `Rename to...` };

        if (correctName) {
            choice = await uiUtils.choices({
                title: 'choice',
                choices: [
                    'Ignore for this run',
                    `Rename`,
                    `Rename to...`,
                    'Ignore for next runs',
                ],
                message: ` - We can rename "${objectWithIssue.fieldName}" to "${correctName}". What do you want to do ?`
            });
        }

        switch (choice['choice']) {
            case 'Ignore for this run':
                return;
            case 'Rename to...':
                while (!correctName.match(new RegExp(`^fk_[a-z0-9]{3}\_[a-z0-9]{3}\_[a-z0-9_]+$`, 'i'))) {
                    correctName = await uiUtils.question({
                        origin: this._origin,
                        text: `What name do you want to name this field ? (it should start with "${expected}")`
                    });
                }
            case 'Rename':
                await DatabaseFileHelper.renameTableField({
                    applicationName: params.applicationName,
                    fieldName,
                    newName: correctName,
                    objectName: objectWithIssue.objectName
                }, uiUtils);
                return;
            case 'Ignore for next runs':
                await DatabaseTagger.addTagOnField({
                    applicationName: params.applicationName,
                    objectName: objectWithIssue.objectName,
                    fieldName: fieldName,
                    tagName: 'ignore-for-fk-check',
                    tagValue: '',
                }, uiUtils);
                return;
            default:
                break;
        }
    }

    private static async fixFileNameIssue(objectWithIssue: ObjectWithIssue, databaseObject: DatabaseObject, uiUtils: UiUtils) {
        uiUtils.info({
            origin: DatabaseChecker._origin,
            message: ` - Renaming ${objectWithIssue.objectType} "${objectWithIssue.fileName}" as "${objectWithIssue.objectName}"`
        });
        const currentObject: DatabaseSubObject = databaseObject[objectWithIssue.objectType][objectWithIssue.fileName];
        let lastVersion: string = '';
        for (let j = 0; j < currentObject.versions.length; j++) {
            const currentObjectVersion = currentObject.versions[j];
            // copy file content into new file name
            if (lastVersion !== currentObjectVersion.version) {
                lastVersion = currentObjectVersion.version;
                FileUtils.writeFileSync(
                    currentObjectVersion.file.replace(
                        `${objectWithIssue.fileName}.sql`,
                        `${objectWithIssue.objectName}.sql`
                    ), (await FileUtils.readFile(currentObjectVersion.file)));
                // change version.json
                const versionJsonFilePath = currentObjectVersion.file.replace(
                    new RegExp(`(.*?\/postgres\/release\/${currentObjectVersion.version}\/)(.*?)$`),
                    '\$1version.json'
                );
                const objectRelativePath = currentObjectVersion.file.replace(new RegExp(`.*?(postgres\/release\/${currentObjectVersion.version}.*?)${objectWithIssue.fileName}.sql`), '$1');

                FileUtils.writeFileSync(
                    versionJsonFilePath,
                    (await FileUtils.readFile(versionJsonFilePath))
                        .replace(`${objectRelativePath}${objectWithIssue.fileName}.sql`, `${objectRelativePath}${objectWithIssue.objectName}.sql`)
                );
                // // delete old object
                FileUtils.deleteFileSync(currentObjectVersion.file);
            }
        }
        // update schema file
        if (currentObject.latestVersion) {
            const existingSchemaFileNamePath = currentObject.latestFile
                .replace(`release/${currentObject.latestVersion}/`, '/');
            const newSchemaFileNamePath = existingSchemaFileNamePath
                .replace(
                    `${objectWithIssue.fileName}.sql`,
                    `${objectWithIssue.objectName}.sql`
                );
            FileUtils.writeFileSync(
                newSchemaFileNamePath,
                await FileUtils.readFile(existingSchemaFileNamePath));

            FileUtils.deleteFileSync(existingSchemaFileNamePath);
        }
    }

}