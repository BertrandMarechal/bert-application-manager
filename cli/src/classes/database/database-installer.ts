import { DatabaseVersionFile, DatabaseObject } from "../../models/database-file.model";
import { FileUtils } from "../../utils/file.utils";
import { PostgresUtils } from "../../utils/postgres.utils";
import { DatabaseHelper } from "./database-helper";
import { RepositoryUtils } from "../../utils/repository.utils";
import { UiUtils } from "../../utils/ui.utils";
import { DatabaseRepositoryReader } from "./database-repo-reader";

export class DatabaseInstaller {
    private static _origin = 'DatabaseInstaller';

    static async installDatabse(params: {
        applicationName: string;
        environment: string;
        version: string;
    }, uiUtils: UiUtils) {
        if (!params.environment) {
            uiUtils.warning({ origin: this._origin, message: 'No environment provided, the installation will be ran for local' });
            params.environment = 'local';
        }
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
        
        // get the db as object to get the params
        let databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        // get the application and its versions
        let databaseData = await DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
        if (!databaseData || !databaseObject) {
            throw 'Invalid application name. Please run the "am repo read" command in the desired folder beforehand.';
        }

        await DatabaseRepositoryReader.readRepo(params.applicationName, databaseObject._properties.path, uiUtils);
        
        // get the application parameters
        const fileParameters = await DatabaseHelper.getApplicationDatabaseParameters(params.applicationName);
        if (!fileParameters[params.environment] || !fileParameters[params.environment].password_root || fileParameters[params.environment].server) {
            while(!fileParameters[params.environment].password_root) {
                fileParameters[params.environment].password_root = await uiUtils.question({
                    origin: DatabaseInstaller._origin,
                    text: 'Please provide the root password'
                });
            }
            while(!fileParameters[params.environment].server) {
                fileParameters[params.environment].server = await uiUtils.question({
                    origin: DatabaseInstaller._origin,
                    text: 'Please provide the root password'
                });
            }
            await DatabaseHelper.updateApplicationDatabaseParameters(params.applicationName, fileParameters);
        }

        // we get the database objects again after we read the repo
        // get the db as object to get the params
        databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        // get the application and its versions
        databaseData = await DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);

        let versionsToInstall: DatabaseVersionFile[] = [];
        if (params.version) {
            const databaseVersion = databaseData.find(x => x.versionName === params.version);
            if (databaseVersion) {
                versionsToInstall.push(databaseVersion);
            }
        } else {
            versionsToInstall = databaseData;
        }
        
        if (!versionsToInstall[0]) {
            throw 'Invalid version name. Please run the "am repo read" again if this version is missing.';
        }

        let paramsPerFile: {
            [fileName: string]: {
                paramName: string;
                value: string;
            }[];
        } = {};
        if (databaseObject && databaseObject._parameters) {

            for (let i = 0; i < Object.keys(databaseObject._parameters).length; i++) {
                const parameterName = Object.keys(databaseObject._parameters)[i];
                for (let j = 0; j < databaseObject._parameters[parameterName].length; j++) {
                    const fileName = databaseObject._parameters[parameterName][j];
                    if (!paramsPerFile[fileName]) {
                        paramsPerFile[fileName] = [];
                    }
                    let parameterValue = '';
                    if (fileParameters && fileParameters[params.environment]) {
                        parameterValue = fileParameters[params.environment][parameterName];
                    }
                    paramsPerFile[fileName].push({
                        paramName: parameterName,
                        value: parameterValue
                    });
                }
            }
        }
        // todo check we have all the params
        // todo check we have the root password
        uiUtils.info({ origin: this._origin, message: `Found ${versionsToInstall.length} versions to install` });
        const postgresUtils = new PostgresUtils();
        let carryOn = true;
        try {
            for (let i = 0; i < versionsToInstall.length && carryOn; i++) {
                const version = versionsToInstall[i];
                for (let j = 0; j < version.versions.length && carryOn; j++) {
                    uiUtils.info({
                        origin: this._origin,
                        message: `Installing ${params.applicationName} ${version.versionName}${version.versions.length > 1 ? ` (${j + 1} of ${version.versions.length})` : ''}`
                    });
                    const subVersion = version.versions[j];
                    if (subVersion.databaseToUse === 'postgres') {
                        postgresUtils.setConnectionString(`postgres://root:${fileParameters[params.environment].password_root}@${fileParameters[params.environment].server || 'localhost'}:5432/postgres`, uiUtils);
                    } else {                        
                        postgresUtils.setConnectionString(`postgres://root:${fileParameters[params.environment].password_root}@${fileParameters[params.environment].server || 'localhost'}:5432/${params.environment}_${databaseObject._properties.dbName}`, uiUtils);
                    }
                    uiUtils.startProgress({length: subVersion.files.length, start: 0, title: `${params.applicationName} - ${version.versionName}`});
                    for (let k = 0; k < subVersion.files.length && carryOn; k++) {
                        const file = subVersion.files[k];
                        let fileString = await FileUtils.readFile(file.fileName);
                        if (paramsPerFile[file.fileName]) {
                            for (let l = 0; l < paramsPerFile[file.fileName].length; l++) {
                                const parameter = paramsPerFile[file.fileName][l];
                                const paramRegex = new RegExp(`\<${parameter.paramName}\>`, 'gi');
                                fileString = fileString.replace(paramRegex, parameter.value);
                            }
                        }
                        try {
                            await postgresUtils.execute(fileString);
                        } catch (error) {
                            uiUtils.stoprProgress();
                            console.log(error);
                            uiUtils.error({origin: this._origin, message: fileString});
                            uiUtils.error({origin: this._origin, message: `Error on file ${file.fileName}`});
                            FileUtils.openFileInFileEditor(file.fileName);
                            let text = 'There has been an issue with this file.\n';
                            text += 'Press "Enter" to retry this file\n';
                            text += 'Use "r" to restart the whole installation\n';
                            text += 'Use "s" to stop\n';
                            const response = await uiUtils.question({
                                origin: this._origin,
                                text: text
                            });
                            switch (response.toLowerCase()) {
                                case 'r':
                                    carryOn = false;
                                    await this.installDatabse(params, uiUtils);
                                    break;
                                case '':
                                    k = k - 1;
                                    uiUtils.startProgress({length: subVersion.files.length, start: k + 1, title: `${params.applicationName} - ${version.versionName}`});
                                    break;
                                case 's':
                                default:
                                    carryOn = false;
                                    break;
                            }
                        }
                        uiUtils.progress(k + 1);
                    }
                    uiUtils.stoprProgress();
                }
            }
        } catch (error) {
            uiUtils.error({origin: this._origin, message: error});
            postgresUtils.endConnection();
            process.exit();
        }
        finally {
            postgresUtils.endConnection();
        }
    }
}