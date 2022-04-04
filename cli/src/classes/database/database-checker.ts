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

type ObjectIssueTypes = 'incorrect-name' | 'incorrect-fk' | 'incorrect-fk-name' | 'not-fk' | 'no-index-on-local-replicated-table';

interface ObjectWithIssue {
    objectType: DatabaseFileType;
    objectName: string;
    fieldName?: string;
    expected?: string;
    issueType: ObjectIssueTypes;
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
        await this.checkFileName(databaseObject, params, uiUtils);
        await this.checkFilesMovesOverVersions(databaseObject, params, uiUtils);
        await this.checkVersionFilesAreInVersionFolder(databaseObject, params, uiUtils);
        await this.checkFilesInSchemaFolder(databaseObject, params, uiUtils);
        await this.checkForeignKeys(databaseObject, params, uiUtils);
        await this.checkReplicatedTableUniqueIndex(databaseObject, params, uiUtils);
    }

    private static async checkVersionFilesAreInVersionFolder(databaseObject: DatabaseObject, params: { applicationName: string }, uiUtils: UiUtils) {
        uiUtils.info({
            origin: this._origin,
            message: `Checking that the files to install in the version are in the version folder`
        });

        let databaseVersionObjects = await DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
        const incorrectFiles = databaseVersionObjects
            .map(databaseVersionObject => {
                const regexVersion = new RegExp(`^\\.\\.\\/\\/postgres\\/release\\/${databaseVersionObject.versionName}\\/`);
                return databaseVersionObject.versions
                    .map(version => version.fileList.filter(f => !regexVersion.test(f)))
                    .reduce((agg: { version: string, fileName: string }[], curr) =>
                        [...agg, ...curr.map(c => ({ version: databaseVersionObject.versionName, fileName: c }))],
                        []);
            }).reduce((agg, curr) => [...agg, ...curr], []);
        if (incorrectFiles.length) {
            const choice = await uiUtils.choices({
                title: 'versionFiles',
                message: `We found ${incorrectFiles.length} files that should be in their version folder and are not\n${
                    incorrectFiles.map(({ version, fileName }) => `${version} - ${fileName}`).join('\n')
                    }\n Do you want to fix those ?`,
                choices: ['Yes', 'No']
            });
            if (choice['versionFiles'] === 'Yes') {
                for (let i = 0; i < incorrectFiles.length; i++) {
                    const incorrectFile = incorrectFiles[i];
                    // first check if the file is contained in the version
                    const fromFileName = databaseObject._properties.path + incorrectFile.fileName
                        .replace(/^\.\.\/\/postgres/, `\/postgres`);
                    const newShortName = incorrectFile.fileName
                        .replace(/^\.\.\/\/postgres/, `\/postgres\/release\/${incorrectFile.version}`)
                    const toFileName = databaseObject._properties.path + newShortName;
                    let inVersionFolder = FileUtils.checkIfFolderExists(toFileName);
                    if (!inVersionFolder) {
                        const choiceCopyFromLocation = await uiUtils.choices({
                            title: 'choiceCopyFromLocation',
                            message: `${incorrectFile.version} ${incorrectFile.fileName} is not in the version's folder. Do you want to copy the one that is specified in the version.json file ?`,
                            choices: ['Yes', 'No']
                        });
                        if (choiceCopyFromLocation.choiceCopyFromLocation === 'Yes') {
                            FileUtils.copyFileSync(fromFileName, toFileName);
                            inVersionFolder = true;
                        } else {
                            uiUtils.warning({
                                origin: this._origin,
                                message: `ignoring`
                            });
                        }
                    }
                    if (inVersionFolder) {
                        // update version.json
                        const versionJsonFileName = databaseObject._properties.path + `/postgres/release/${incorrectFile.version}/version.json`;
                        FileUtils.writeFileSync(
                            versionJsonFileName,
                            (await FileUtils.readFile(versionJsonFileName))
                                .replace(incorrectFile.fileName, '../' + newShortName)
                        );
                    }
                }
                await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                uiUtils.success({
                    origin: this._origin,
                    message: `All done`
                });
            } else {
                uiUtils.warning({
                    origin: this._origin,
                    message: `ignoring`
                });
            }
        } else {
            uiUtils.success({
                origin: this._origin,
                message: `All files are in the version's folder`
            });
        }
    }
    private static async checkFilesMovesOverVersions(databaseObject: DatabaseObject, params: { applicationName: string }, uiUtils: UiUtils) {
        uiUtils.info({
            origin: this._origin,
            message: `Checking that the files in the versions are kept in the same "folder"`
        });

        const entitiesToCheck = [
            'table',
            'function',
            'setup',
            'index',
            'type',
            'data',
            'sequence',
            'trigger',
            'view',
            'foreign-servers',
            'user-mappings',
            'local-tables',
            'foreign-tables',
            'source-specific-app-setup',
            'data-transfers',
            'external-system-integrations',
            'data-exchange',
            'users-roles-permissions',
            'full-text-catalogues'
        ];

        for (let j = 0; j < entitiesToCheck.length; j++) {
            const entityToCheck = entitiesToCheck[j];

            const objectsWithIssues: Record<string, { obj: DatabaseSubObject, switches: { version: string, short: string }[] }> =
                Object.keys(databaseObject[entityToCheck]).reduce((agg: Record<string, { obj: DatabaseSubObject, switches: { version: string, short: string }[] }>, curr) => {
                    const obj: DatabaseSubObject = databaseObject[entityToCheck][curr];
                    const objectVersionsFiles = obj.versions.map(({ version, file }) => ({
                        version,
                        short: file.replace(/^.*?\/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+|current)\//, '\/')
                    }));

                    const issues = objectVersionsFiles.reduce((agg: { switches: { version: string, short: string }[], current: string }, curr, i) => {
                        if (i > 0) {
                            if (agg.current.toLowerCase() !== curr.short.toLowerCase()) {
                                agg.current = curr.short;
                                agg.switches.push({ version: curr.version, short: curr.short });
                            }
                            return agg;
                        } else {
                            return {
                                switches: [{ version: curr.version, short: curr.short }],
                                current: curr.short
                            };
                        }
                    }, { switches: [], current: '' });
                    if (issues.switches.length > 1) {
                        agg[curr] = { obj, switches: issues.switches };
                    }
                    return agg;
                }, {});
            const keys = Object.keys(objectsWithIssues);
            if (keys.length) {
                uiUtils.warning({
                    origin: this._origin,
                    message: `Checked ${Object.keys(databaseObject[entityToCheck]).length} file${Object.keys(databaseObject[entityToCheck]).length > 1 ? 's' : ''}, Found ${keys.length} issue${keys.length > 1 ? 's' : ''}\nWe will loop through them and let you decide what to do with th${keys.length > 1 ? 'ose' : 'is'} file${keys.length > 1 ? 's' : ''}`
                });
                for (let k = 0; k < keys.length; k++) {
                    const key = keys[k];
                    const choices = await uiUtils.choices({
                        title: 'procesFile',
                        message: `${entityToCheck} "${key}" has changed location over the time. Which location do you want to keep ?`,
                        choices: ['Ignore', ...objectsWithIssues[key].switches.map(({ version, short }) => `${version}\t-\t${short}`)]
                    });
                    if (choices['procesFile'] !== 'Ignore') {
                        const correctShort = choices['procesFile'].split('\t-\t')[1];
                        // get all the incorrect locations to update
                        const versionFilesToUpdate = objectsWithIssues[key].obj.versions.filter(({ file }) => !file.match(new RegExp(correctShort, 'i')));
                        for (let l = 0; l < versionFilesToUpdate.length; l++) {
                            const versionFileToUpdate = versionFilesToUpdate[l];
                            if (FileUtils.checkIfFolderExists(versionFileToUpdate.file)) {
                                const incorrectVersion = versionFileToUpdate.version;
                                const incorrectShort = versionFileToUpdate.file.split(incorrectVersion)[1];
                                // - create the file in the new location
                                FileUtils.writeFileSync(
                                    databaseObject._properties.path + `/postgres/release/${incorrectVersion}` + correctShort,
                                    (await FileUtils.readFile(versionFileToUpdate.file))
                                );
                                if (incorrectVersion === objectsWithIssues[key].obj.latestVersion) {
                                    // - create the file in the new location in the postgres/schema folder
                                    FileUtils.writeFileSync(
                                        databaseObject._properties.path + `/postgres` + correctShort,
                                        (await FileUtils.readFile(versionFileToUpdate.file))
                                    );
                                }
                                // - update the version.json
                                FileUtils.writeFileSync(
                                    databaseObject._properties.path + `/postgres/release/${incorrectVersion}/version.json`,
                                    (await FileUtils.readFile(databaseObject._properties.path + `/postgres/release/${incorrectVersion}/version.json`))
                                        .replace(new RegExp(incorrectShort), correctShort)
                                );
                                // - delete the old file
                                if (FileUtils.checkIfFolderExists(versionFileToUpdate.file)) {
                                    FileUtils.deleteFileSync(versionFileToUpdate.file);
                                }
                                // - delete the old file in the postgres/schema folder
                                if (FileUtils.checkIfFolderExists(databaseObject._properties.path + `/postgres` + incorrectShort)) {
                                    FileUtils.deleteFileSync(databaseObject._properties.path + `/postgres` + incorrectShort);
                                }
                            }
                        }
                    }
                }
                uiUtils.info({
                    origin: this._origin,
                    message: `Cleaning the repository from empty folders...`
                });
                FileUtils.deleteEmptyFolders({
                    startPath: databaseObject._properties.path
                });
                await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                uiUtils.success({
                    origin: this._origin,
                    message: `All done`
                });
            } else {
                uiUtils.success({
                    origin: this._origin,
                    message: `Checked ${Object.keys(databaseObject[entityToCheck]).length} files for ${entityToCheck} for location change - all seem fine`
                });
            }
        }

    }

    private static async checkFilesInSchemaFolder(databaseObject: DatabaseObject, params: { applicationName: string }, uiUtils: UiUtils) {
        uiUtils.info({
            origin: this._origin,
            message: `Checking files in postgres/schema against postgres/release/*.*.*.*/schema`
        });
        let postgresSchemaFiles = await FileUtils.getFileList({
            startPath: path.resolve(databaseObject._properties.path, 'postgres', 'schema'),
            filter: /\.sql/
        });
        let postgresReleaseSchemaFiles = await FileUtils.getFileList({
            startPath: path.resolve(databaseObject._properties.path, 'postgres', 'release'),
            filter: /[0-9]+.[0-9]+.[0-9]+.[0-9]+(\/|\\)schema.*?\.sql$/
        });

        postgresSchemaFiles = postgresSchemaFiles.map(fileName => fileName.replace(databaseObject._properties.path + '/postgres/schema', '').toLowerCase());
        const flattenedPostgresReleaseSchemaFiles: Record<string, { fileName: string, version: string, short: string }> = postgresReleaseSchemaFiles
            .filter(fileName => fileName.indexOf('/current/') === -1)
            .map(fileName => ({
                fileName: fileName.toLowerCase(),
                version: (fileName.match(/\/([0-9]+)\.([0-9]+)\.([0-9]+)\.([0-9]+)\//i) as string[]).reduce((agg, curr, i) => {
                    if (i === 0 || i > 4) {
                        return agg;
                    }
                    return agg + `00000${curr}`.substring(-5)
                }, ''),
                short: fileName
                    .replace(new RegExp(databaseObject._properties.path + '\\/postgres\\/release\\/[0-9]+.[0-9]+.[0-9]+.[0-9]+\/schema'), '')
                    .toLowerCase()
            }))
            .reduce((agg: Record<string, { fileName: string, version: string, short: string }>, curr) => {
                agg[curr.short] = agg[curr.short] ? (agg[curr.short].version < curr.version ? curr : agg[curr.short]) : curr;
                return agg;
            }, {});
        postgresReleaseSchemaFiles = Object.keys(flattenedPostgresReleaseSchemaFiles);

        uiUtils.info({
            origin: this._origin,
            message: `Analyzing ${postgresSchemaFiles.length + postgresReleaseSchemaFiles.length} files...`
        });
        const missingFilesInPostgresSchema = postgresReleaseSchemaFiles.filter(x => postgresSchemaFiles.indexOf(x) === -1);
        await this.checkFilesInVersionNotPostgres(
            flattenedPostgresReleaseSchemaFiles, missingFilesInPostgresSchema, databaseObject, uiUtils);
        const missingFilesInVersions = postgresSchemaFiles.filter(x => postgresReleaseSchemaFiles.indexOf(x) === -1);
        await this.checkFilesInPostgresNotVersion(missingFilesInVersions, databaseObject, uiUtils);
        await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
        databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
    }

    private static async checkFilesInPostgresNotVersion(missingFiles: string[], databaseObject: DatabaseObject, uiUtils: UiUtils) {
        uiUtils.info({
            origin: this._origin,
            message: `  - Checking missing files in versions and that exist in postgres/schema`
        });
        if (missingFiles.length) {
            const response = await uiUtils.choices({
                message: `  - ${missingFiles.length} missing files found:\n - ${missingFiles.join('\n - ')}\n Do you wnat to try and fix those ?`,
                choices: ['Yes', 'No'],
                title: 'Missing Files'
            });
            if (response['Missing Files'] === 'Yes') {
                const responseMethod = await uiUtils.choices({
                    message: `  - What do you want to do with them ?`,
                    choices: [
                        'Remove from postgres/schema',
                        'Solve one at a time'
                    ],
                    title: 'Mode'
                });
                if (responseMethod['Mode'] === 'Remove from postgres/schema') {
                    uiUtils.info({
                        origin: this._origin,
                        message: `  - Removing`
                    });
                    for (let i = 0; i < missingFiles.length; i++) {
                        const missingFileInPostgresSchema = missingFiles[i];
                        FileUtils.deleteFileSync(databaseObject._properties.path + '/postgres/schema' + missingFileInPostgresSchema);
                    }
                    uiUtils.success({
                        origin: this._origin,
                        message: `  => Removed`
                    });
                } else if (responseMethod['Mode'] === 'Solve one at a time') {
                    for (let i = 0; i < missingFiles.length; i++) {
                        const missingFileInPostgresSchema = missingFiles[i];
                        const solution = await uiUtils.choices({
                            message: `  - What do you want to do with "${missingFileInPostgresSchema}" ?`,
                            choices: [
                                'Remove from postgres/schema',
                                'Nothing'
                            ],
                            title: 'solution'
                        });
                        if (solution['solution'] === 'Remove from postgres/schema') {
                            FileUtils.deleteFileSync(databaseObject._properties.path + '/postgres/schema' + missingFileInPostgresSchema);
                        }
                    }
                    uiUtils.success({
                        origin: this._origin,
                        message: `  => Solved`
                    });
                }
            }
        } else {
            uiUtils.success({
                origin: this._origin,
                message: `  => All fine`
            });
        }
    }

    private static async checkFilesInVersionNotPostgres(flattenedPostgresReleaseSchemaFiles: Record<string, { fileName: string, version: string, short: string }>, missingFiles: string[], databaseObject: DatabaseObject, uiUtils: UiUtils) {
        uiUtils.info({
            origin: this._origin,
            message: `  - Checking missing files in postgres/schema and that exist in version`
        });
        if (missingFiles.length) {
            const response = await uiUtils.choices({
                message: `  - ${missingFiles.length} missing files found:\n - ${missingFiles.join('\n - ')}\n Do you wnat to try and fix those ?`,
                choices: ['Yes', 'No'],
                title: 'Missing Files'
            });
            if (response['Missing Files'] === 'Yes') {
                const responseMethod = await uiUtils.choices({
                    message: `  - What do you want to do with them ?`,
                    choices: [
                        'Add them to postgres/schema',
                        'Solve one at a time'
                    ],
                    title: 'Mode'
                });
                if (responseMethod['Mode'] === 'Add them to postgres/schema') {
                    uiUtils.info({
                        origin: this._origin,
                        message: `  - Copying`
                    });
                    for (let i = 0; i < missingFiles.length; i++) {
                        const missingFileInPostgresSchema = flattenedPostgresReleaseSchemaFiles[missingFiles[i]];
                        FileUtils.writeFileSync(
                            databaseObject._properties.path + '/postgres/schema' + missingFileInPostgresSchema.short,
                            await FileUtils.readFile(missingFileInPostgresSchema.fileName)
                        );
                    }
                    uiUtils.success({
                        origin: this._origin,
                        message: `  => Copied`
                    });
                } else if (responseMethod['Mode'] === 'Solve one at a time') {
                    for (let i = 0; i < missingFiles.length; i++) {
                        const missingFileInPostgresSchema = flattenedPostgresReleaseSchemaFiles[missingFiles[i]];

                        const solution = await uiUtils.choices({
                            message: `  - What do you want to do with "${missingFileInPostgresSchema.short}" ?`,
                            choices: [
                                'Add to postgres/schema',
                                'Nothing'
                            ],
                            title: 'solution'
                        });
                        if (solution['solution'] === 'Add to postgres/schema') {
                            FileUtils.writeFileSync(
                                databaseObject._properties.path + '/postgres/schema' + missingFileInPostgresSchema.short,
                                await FileUtils.readFile(missingFileInPostgresSchema.fileName)
                            );
                        }
                    }
                    uiUtils.success({
                        origin: this._origin,
                        message: `  => Solved`
                    });
                }
            }
        } else {
            uiUtils.success({
                origin: this._origin,
                message: `  => All fine`
            });
        }
    }

    private static async checkForeignKeys(databaseObject: DatabaseObject, params: { applicationName: string }, uiUtils: UiUtils) {
        uiUtils.info({
            origin: DatabaseChecker._origin,
            message: `Checking foreign keys...`
        });

        const objectsWithIssue: ObjectWithIssue[] = [];
        const filesToAnalyzeLength =
            Object.keys(databaseObject.table).length;
        if (filesToAnalyzeLength > 0) {
            let i = 0;
            if (Object.keys(databaseObject.table).length > 0) {
                const keys = Object.keys(databaseObject.table);
                for (let j = 0; j < keys.length; j++) {
                    uiUtils.progress(++i);
                    const key = keys[j];
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
                for (let i = 0; i < objectsWithIssue.length; i++) {
                    const objectWithIssue = objectsWithIssue[i];
                    if (objectWithIssue.issueType === 'incorrect-fk-name') {
                        uiUtils.warning({
                            origin: DatabaseChecker._origin,
                            message: `   - ${objectWithIssue.objectType} "${objectWithIssue.fileName}"."${colors.yellow(objectWithIssue.fieldName as string)}" was expected to be called ${colors.green(objectWithIssue.expected as string)}*`
                        });
                    } else if (objectWithIssue.issueType === 'not-fk') {
                        uiUtils.warning({
                            origin: DatabaseChecker._origin,
                            message: `   - ${objectWithIssue.objectType} "${objectWithIssue.fileName}"."${colors.yellow(objectWithIssue.fieldName as string)}" does not seem to be a foreign key, and yet is prefixed "fk"`
                        });
                    }
                }

                let fix = (await uiUtils.choices({
                    title: 'do-it',
                    message: `Do you want to fix the file issues above ?`,
                    choices: ['Yes', 'No'],
                }))['do-it'] === 'Yes';

                if (fix) {
                    uiUtils.info({
                        origin: DatabaseChecker._origin,
                        message: `Fixing...`
                    });

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
                    uiUtils.success({
                        origin: DatabaseChecker._origin,
                        message: `Fixed`
                    });
                    await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                    databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                }
            } else {
                uiUtils.success({
                    origin: DatabaseChecker._origin,
                    message: `Checked ${filesToAnalyzeLength} files for foreign keys - The files are looking all good.`
                });
            }
        }
    }

    private static async checkReplicatedTableUniqueIndex(databaseObject: DatabaseObject, params: { applicationName: string }, uiUtils: UiUtils) {
        const objectsWithIssue: ObjectWithIssue[] = [];
        const filesToAnalyzeLength =
            Object.keys(databaseObject['local-tables']).length;
        if (filesToAnalyzeLength > 0) {
            let i = 0;
            if (Object.keys(databaseObject['local-tables']).length > 0) {
                const keys = Object.keys(databaseObject['local-tables']);
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    // check that the column named 'pk_*' is unique or primary key
                    const fileString = await FileUtils.readFile(databaseObject['local-tables'][key].latestFile);
                    const matched = fileString.match(/\W(pk_[a-z0-9]{3}_id)\W([^,]+),/i);
                    if (matched) {
                        const restOfTheCode = matched[2].toLowerCase();
                        if (restOfTheCode.indexOf('unique') === -1) {
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

            if (objectsWithIssue.length > 0) {
                for (let i = 0; i < objectsWithIssue.length; i++) {
                    const objectWithIssue = objectsWithIssue[i];
                    uiUtils.warning({
                        origin: DatabaseChecker._origin,
                        message: `   - ${objectWithIssue.objectType} "${objectWithIssue.fileName}"."${colors.yellow(objectWithIssue.fieldName as string)}" does not have an index defined on it`
                    });
                }

                let fix = (await uiUtils.choices({
                    title: 'do-it',
                    message: `Do you want to fix the file issues above ?`,
                    choices: ['Yes', 'No'],
                }))['do-it'] === 'Yes';

                if (fix) {
                    uiUtils.info({
                        origin: DatabaseChecker._origin,
                        message: `Fixing...`
                    });
                    const objectsToProcess = objectsWithIssue.filter(x => x.issueType === 'no-index-on-local-replicated-table');
                    if (objectsToProcess.length) {
                        for (let i = 0; i < objectsToProcess.length; i++) {
                            const objectToProcess = objectsToProcess[i];
                            await this.fixNotIndexOnLocalReplicatedTableIssue(objectToProcess, databaseObject, params, uiUtils);
                        }
                    }
                    uiUtils.success({
                        origin: DatabaseChecker._origin,
                        message: `Fixed`
                    });
                    await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                    databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                }
            } else {
                uiUtils.success({
                    origin: DatabaseChecker._origin,
                    message: `Checked ${filesToAnalyzeLength} files for unique constraints issues - The files are looking all good.`
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
        catch (e: any) {
            uiUtils.info({
                origin: this._origin,
                message: e.toString()
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
                catch (e: any) {
                    uiUtils.info({
                        origin: this._origin,
                        message: e.toString()
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

    private static async checkFileName(databaseObject: DatabaseObject, params: { applicationName: string }, uiUtils: UiUtils) {
        uiUtils.info({
            origin: DatabaseChecker._origin,
            message: `Checking file names against object names...`
        });
        const objectsWithIssue: ObjectWithIssue[] = [];
        const filesToAnalyzeLength =
            Object.keys(databaseObject.table).length +
            Object.keys(databaseObject.function).length;
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
            uiUtils.stoprProgress();

            if (objectsWithIssue.length > 0) {
                for (let i = 0; i < objectsWithIssue.length; i++) {
                    const objectWithIssue = objectsWithIssue[i];
                    uiUtils.warning({
                        origin: DatabaseChecker._origin,
                        message: `   - ${objectWithIssue.objectType} "${colors.yellow(objectWithIssue.fileName)}" is actually named "${colors.green(objectWithIssue.objectName)}"`
                    });
                }

                let fix = (await uiUtils.choices({
                    title: 'do-it',
                    message: `Do you want to fix the file issues above ?`,
                    choices: ['Yes', 'No'],
                }))['do-it'] === 'Yes';

                if (fix) {
                    uiUtils.info({
                        origin: DatabaseChecker._origin,
                        message: `Fixing...`
                    });
                    for (let i = 0; i < objectsWithIssue.length; i++) {
                        const objectWithFileNameIssue = objectsWithIssue[i];
                        await this.fixFileNameIssue(objectWithFileNameIssue, databaseObject, uiUtils);
                    }
                    uiUtils.success({
                        origin: DatabaseChecker._origin,
                        message: `Fixed`
                    });
                    await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
                    databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
                }
            } else {
                uiUtils.success({
                    origin: DatabaseChecker._origin,
                    message: `Checked ${filesToAnalyzeLength} files for file name issue - The files are looking all good.`
                });
            }
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
