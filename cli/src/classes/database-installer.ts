import { DatabaseVersionFile, DatabaseObject } from "../models/database-file.model";
import { DatabaseRepositoryReader } from "./database-repo-reader";
import { FileUtils } from "../utils/file.utils";
import { LoggerUtils } from "../utils/logger.utils";
import { Bar, Presets } from 'cli-progress';
import { PostgresUtils } from "../utils/postgres.utils";
import {exec} from 'child_process';

export class DatabaseInstaller {
    private static _origin = 'DatabaseRepositoryReader';

    static async installDatabse(params: {
        applicationName: string;
        environment: string;
        version: string;
    }) {
        if (!params.environment) {
            LoggerUtils.warning({ origin: this._origin, message: 'No environment provided, the installation will be ran for local' });
            params.environment = 'local';
        }
        if (!params.applicationName) {
            throw 'No application name provided, please use the -an parameter.';
        }

        // get the application and its versions
        let fileData: { [name: string]: DatabaseVersionFile[] } = {};
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader.postgresDbFilesPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseRepositoryReader.postgresDbFilesPath);
        }
        if (!params.applicationName.match(/\-database$/)) {
            params.applicationName += '-database';
        }
        const databaseData = fileData[params.applicationName];
        if (!databaseData) {
            throw 'Invalid application name. Please run the "read-repo" command in the desired folder beforehand.';
        }
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
            throw 'Invalid version name. Please run the "read-repo" again if this version is missing.';
        }
        // get the db as object to get the params
        let fileDatabaseObject: { [database: string]: DatabaseObject } = {};
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader.postgresDbDataPath)) {
            fileDatabaseObject = await FileUtils.readJsonFile(DatabaseRepositoryReader.postgresDbDataPath);
        }

        // get the application parameters
        let fileParameters: { [database: string]: { [env: string]: { [param: string]: string } } } = {};
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader.postgresDbParamsPath)) {
            fileParameters = await FileUtils.readJsonFile(DatabaseRepositoryReader.postgresDbParamsPath);
        }
        let paramsPerFile: {
            [fileName: string]: {
                paramName: string;
                value: string;
            }[];
        } = {};
        if (fileDatabaseObject[params.applicationName] && fileDatabaseObject[params.applicationName]._parameters) {

            for (let i = 0; i < Object.keys(fileDatabaseObject[params.applicationName]._parameters).length; i++) {
                const parameterName = Object.keys(fileDatabaseObject[params.applicationName]._parameters)[i];
                for (let j = 0; j < fileDatabaseObject[params.applicationName]._parameters[parameterName].length; j++) {
                    const fileName = fileDatabaseObject[params.applicationName]._parameters[parameterName][j];
                    if (!paramsPerFile[fileName]) {
                        paramsPerFile[fileName] = [];
                    }
                    let parameterValue = '';
                    if (fileParameters[params.applicationName] && fileParameters[params.applicationName][params.environment]) {
                        parameterValue = fileParameters[params.applicationName][params.environment][parameterName];
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

        LoggerUtils.info({ origin: this._origin, message: `Found ${versionsToInstall.length} versions to install` });
        const postgresUtils = new PostgresUtils();
        try {
            for (let i = 0; i < versionsToInstall.length; i++) {
                const version = versionsToInstall[i];
                for (let j = 0; j < version.versions.length; j++) {
                    LoggerUtils.info({
                        origin: this._origin,
                        message: `Installing ${params.applicationName} ${version.versionName}${version.versions.length > 1 ? ` (${j + 1} of ${version.versions.length})` : ''}`
                    });
                    const subVersion = version.versions[j];
                    if (subVersion.databaseToUse === 'postgres') {
                        postgresUtils.setConnectionString(`postgres://root:${fileParameters[params.applicationName][params.environment].password_root}@${fileParameters[params.applicationName][params.environment].server || 'localhost'}:5432/postgres`);
                    } else {
                        console.log(params.applicationName, fileDatabaseObject[params.applicationName]._properties);
                        
                        postgresUtils.setConnectionString(`postgres://root:${fileParameters[params.applicationName][params.environment].password_root}@${fileParameters[params.applicationName][params.environment].server || 'localhost'}:5432/${params.environment}_${fileDatabaseObject[params.applicationName]._properties.dbName}`);
                    }
                    const bar = new Bar({
                        format: `${params.applicationName} - ${version.versionName}  [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
                        clearOnComplete: true
                    }, Presets.shades_grey);
                    bar.start(subVersion.files.length, 0);
                    for (let k = 0; k < subVersion.files.length; k++) {
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
                            let commandLine = '';
                            
                            switch (process.platform) { 
                               case 'darwin' : commandLine = 'open'; break;
                               case 'win32' : commandLine = 'start'; break;
                               default : commandLine = 'xdg-open'; break;
                            }
                            exec(`"${file.fileName}"`);
                            LoggerUtils.error({origin: this._origin, message: fileString});
                            LoggerUtils.error({origin: this._origin, message: `Error on file ${file.fileName}`});
                            throw error;
                        }
                        bar.update(k + 1);
                    }
                    bar.stop();
                }
            }
        } catch (error) {
            LoggerUtils.error({origin: this._origin, message: error});
            postgresUtils.endConnection();
            process.exit();
        }
        finally {
            postgresUtils.endConnection();
        }

    }
}