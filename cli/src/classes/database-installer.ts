import { DatabaseVersionFile, DatabaseObject } from "../models/database-file.model";
import { DatabaseRepositoryReader } from "./database-repo-reader";
import { FileUtils } from "../utils/file.utils";
import { LoggerUtils } from "../utils/logger.utils";
import { Bar, Presets } from 'cli-progress';
import { PostgresUtils } from "../utils/postgres.utils";
import {exec} from 'child_process';
import { resolve } from "url";
import { DatabaseHelper } from "./database-helper";

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
        if (!params.applicationName.match(/\-database$/)) {
            params.applicationName += '-database';
        }

        // get the application and its versions
        const databaseData = await DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
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
        const DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);

        // get the application parameters
        const fileParameters = await DatabaseHelper.getApplicationDatabaseParameters(params.applicationName);
        let paramsPerFile: {
            [fileName: string]: {
                paramName: string;
                value: string;
            }[];
        } = {};
        if (DatabaseObject && DatabaseObject._parameters) {

            for (let i = 0; i < Object.keys(DatabaseObject._parameters).length; i++) {
                const parameterName = Object.keys(DatabaseObject._parameters)[i];
                for (let j = 0; j < DatabaseObject._parameters[parameterName].length; j++) {
                    const fileName = DatabaseObject._parameters[parameterName][j];
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
        LoggerUtils.info({ origin: this._origin, message: `Found ${versionsToInstall.length} versions to install` });
        const postgresUtils = new PostgresUtils();
        let carryOn = true;
        try {
            for (let i = 0; i < versionsToInstall.length && carryOn; i++) {
                const version = versionsToInstall[i];
                for (let j = 0; j < version.versions.length && carryOn; j++) {
                    LoggerUtils.info({
                        origin: this._origin,
                        message: `Installing ${params.applicationName} ${version.versionName}${version.versions.length > 1 ? ` (${j + 1} of ${version.versions.length})` : ''}`
                    });
                    const subVersion = version.versions[j];
                    if (subVersion.databaseToUse === 'postgres') {
                        postgresUtils.setConnectionString(`postgres://root:${fileParameters[params.environment].password_root}@${fileParameters[params.environment].server || 'localhost'}:5432/postgres`);
                    } else {                        
                        postgresUtils.setConnectionString(`postgres://root:${fileParameters[params.environment].password_root}@${fileParameters[params.environment].server || 'localhost'}:5432/${params.environment}_${DatabaseObject._properties.dbName}`);
                    }
                    let bar = new Bar({
                        format: `${params.applicationName} - ${version.versionName}  [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
                        clearOnComplete: true
                    }, Presets.shades_grey);
                    bar.start(subVersion.files.length, 0);
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
                            bar.stop();
                            LoggerUtils.error({origin: this._origin, message: fileString});
                            LoggerUtils.error({origin: this._origin, message: `Error on file ${file.fileName}`});
                            await new Promise((resolve, reject) => {
                                try {
                                    const cp = exec(`"${file.fileName}"`, (error, stdout, stderr) => {
                                        if (error) {
                                          reject(`exec error: ${error}`);
                                          return;
                                        }
                                        cp.kill();
                                        resolve();
                                      });
                                  } catch (error) {
                                      reject(error);
                                  }
                            });
                            let text = 'There has been an issue with this file.\n';
                            text += 'Press "Enter" to retry this file\n';
                            text += 'Use "r" to restart the whole installation\n';
                            text += 'Use "s" to stop\n';
                            const response = await LoggerUtils.question({
                                origin: this._origin,
                                text: text
                            });
                            switch (response.toLowerCase()) {
                                case 'r':
                                    carryOn = false;
                                    await this.installDatabse(params);
                                    break;
                                case '':
                                    k = k - 1;
                                    bar.start(k + 1, 0);
                                    break;
                                case 's':
                                default:
                                    carryOn = false;
                                    break;
                            }
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