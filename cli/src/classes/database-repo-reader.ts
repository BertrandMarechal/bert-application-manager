import { FileUtils } from "../utils/file.utils";
import { LoggerUtils } from "../utils/logger.utils";
import path from 'path';
import colors from 'colors';
import { DatabaseVersionFile, DatabaseObject, DatabaseTable } from "../models/database-file.model";

export class DatabaseRepositoryReader {
    private static _origin = 'DatabaseRepositoryReader';
    private static _tempFolderPath = path.resolve(process.argv[1], '../../../temp');
    static postgresDbFilesPath = DatabaseRepositoryReader._tempFolderPath + '/postgres-dbs.json';
    static postgresDbParamsPath = DatabaseRepositoryReader._tempFolderPath + '/postgres-db-params.json';
    static postgresDbDataPath = DatabaseRepositoryReader._tempFolderPath + '/postgres-db-data.json';
    static releasesPath = 'postgres/release';

    static async readRepo(startPath: string, repoName: string) {
        // we have to get the list of files and read them
        const versionFiles = await FileUtils.getFileList({
            startPath: path.resolve(startPath, DatabaseRepositoryReader.releasesPath),
            filter: /version.json$/
        });
        LoggerUtils.info({ origin: DatabaseRepositoryReader._origin, message: `${versionFiles.length} files found` });

        // read the current db file and add on
        FileUtils.createFolderStructureIfNeeded(DatabaseRepositoryReader._tempFolderPath);
        let fileData: { [name: string]: DatabaseVersionFile[] } = {};
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader.postgresDbFilesPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseRepositoryReader.postgresDbFilesPath);
        }
        fileData[repoName] = await DatabaseRepositoryReader._readFiles(versionFiles);
        LoggerUtils.info({ origin: DatabaseRepositoryReader._origin, message: `Saving data in postgres db file` });
        FileUtils.writeFileSync(DatabaseRepositoryReader.postgresDbFilesPath, JSON.stringify(fileData, null, 2));

        // read the current db file and add on
        FileUtils.createFolderStructureIfNeeded(DatabaseRepositoryReader._tempFolderPath);
        let fileData2: { [name: string]: DatabaseObject } = {};
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader.postgresDbDataPath)) {
            fileData2 = await FileUtils.readJsonFile(DatabaseRepositoryReader.postgresDbDataPath);
        }
        fileData2[repoName] = await DatabaseRepositoryReader._extractObjectInformation(fileData[repoName], startPath);
        LoggerUtils.info({ origin: DatabaseRepositoryReader._origin, message: `Saving data in postgres objects db file` });
        FileUtils.writeFileSync(DatabaseRepositoryReader.postgresDbDataPath, JSON.stringify(fileData2, null, 2));
    }

    private static async _readFiles(files: string[]): Promise<DatabaseVersionFile[]> {
        const filesRead = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileData = await FileUtils.readJsonFile(file);
            filesRead.push(new DatabaseVersionFile(file, fileData));
        }
        return filesRead;
    }

    private static async _extractObjectInformation(databaseFiles: DatabaseVersionFile[], path: string): Promise<DatabaseObject> {
        databaseFiles = databaseFiles.filter(x => x.versionName === 'current' || x.versionName.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/));
        databaseFiles.sort((a, b) => {
            let vA = 0, vB = 0;
            if (a.versionName === 'current') {
                vA = Infinity;
            } else {
                vA = +a.versionName
                    .split('.')
                    .map((x, i) => +x + 1000)
                    .reduce((agg, curr) => `${agg}${curr}`, '');
            }
            if (b.versionName === 'current') {
                vB = Infinity;
            } else {
                vB = +b.versionName
                    .split('.')
                    .map((x, i) => +x + 1000)
                    .reduce((agg, curr) => `${agg}${curr}`, '');
            }
            return vA - vB;
        });
        const databaseObject: DatabaseObject = new DatabaseObject();
        databaseFiles.forEach(databaseFile => {
            if (databaseFile.versionName === 'current') {
                databaseObject._properties.hasCurrent = true;
            }
            databaseFile.versions.forEach(version => {
                version.files.forEach(file => {
                    if (file.type !== 'unknown') {
                        if (!databaseObject[file.type]) {
                            databaseObject[file.type] = {};
                        }
                        if (!databaseObject[file.type][file.objectName]) {
                            databaseObject[file.type][file.objectName] = {
                                latestFile: file.fileName,
                                latestVersion: databaseFile.versionName,
                                versions: [{
                                    file: file.fileName,
                                    version: databaseFile.versionName
                                }]
                            };
                        } else {
                            databaseObject[file.type][file.objectName].latestFile = file.fileName;
                            databaseObject[file.type][file.objectName].latestVersion = databaseFile.versionName;
                            databaseObject[file.type][file.objectName].versions.push({
                                file: file.fileName,
                                version: databaseFile.versionName
                            });
                        }
                    }
                })
            });
        });

        if (Object.keys(databaseObject.table).length > 0) {
            Object.keys(databaseObject.table).forEach(async key => {
                databaseObject.table[key] = new DatabaseTable(databaseObject.table[key]);
                await databaseObject.table[key].analyzeFile();
            });
        }

        if (Object.keys(databaseObject.table).length > 0 && Object.keys(databaseObject.table)[0].match(/^([a-z]{2,4})t_/)) {
            const dbNameRegex = /^([a-z]{2,4})t_/g.exec(Object.keys(databaseObject.table)[0]);
            Object.keys(databaseObject.table)[0];
            if (dbNameRegex) {
                databaseObject._properties.dbName = dbNameRegex[1];
            }
        }

        // read the files to check for parameters
        const filesToWatch: string[] = databaseFiles.map(databaseFile => {
            return databaseFile.versions.map(version => {
                return version.files.map(file => file.fileName);
            }).reduce((agg, curr) => agg.concat(curr), [])
        }).reduce((agg, curr) => agg.concat(curr), []);
        const variableRegex = new RegExp(/\<(\w+)\>/gim);
        const variablesPerFiles: { [name: string]: string[] } = {};

        for (let i = 0; i < filesToWatch.length; i++) {
            const element = filesToWatch[i];
            const data = await FileUtils.readFile(element);
            const variablesArray: string[] = (data.match(variableRegex) || []);
            if (variablesArray.length > 0) {
                const startArray: string[] = [];
                const variablesForFile = variablesArray
                    .reduce((agg, curr) => (agg.indexOf(curr) > -1 ? agg : [...agg, curr]), startArray)
                    .map((x: string) => x.substr(1, x.length - 2));
                for (let j = 0; j < variablesForFile.length; j++) {
                    const variable = variablesForFile[j];
                    if (!variablesPerFiles[variable]) {
                        variablesPerFiles[variable] = [];
                    }
                    variablesPerFiles[variable].push(element);
                }
            }
        }
        databaseObject._parameters = variablesPerFiles;
        databaseObject._properties.path = path;

        return databaseObject;
    }

    static async checkParams(filter: string, env: string) {
        if (!env) {
            LoggerUtils.warning({ origin: this._origin, message: 'No environment provided, the check will be ran for local' });
            env = 'local';
        }
        // get the database parameters
        FileUtils.createFolderStructureIfNeeded(DatabaseRepositoryReader._tempFolderPath);
        let fileDataDatabaseObject: { [name: string]: DatabaseObject } = {};
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader.postgresDbDataPath)) {
            fileDataDatabaseObject = await FileUtils.readJsonFile(DatabaseRepositoryReader.postgresDbDataPath);
        }
        let databasesToCheck = Object.keys(fileDataDatabaseObject);
        
        // filter them if needed
        if (filter) {
            databasesToCheck = databasesToCheck.filter(x => x.indexOf(filter) > -1);
        }
        // get the parameters to set
        let databaseParams: { databaseName: string; paramName: string }[] = [];
        for (let i = 0; i < databasesToCheck.length; i++) {
            const database = databasesToCheck[i];

            databaseParams = databaseParams.concat(Object.keys((fileDataDatabaseObject[database]._parameters || {})).map(x => ({
                databaseName: database,
                paramName: x
            })));
        }
        if (databaseParams.length === 0) {
            throw 'No database parameters detected';
        }

        // read the current db file and add on
        FileUtils.createFolderStructureIfNeeded(DatabaseRepositoryReader._tempFolderPath);
        let databaseParametersFromDb: { [database: string]: { [env: string]: { [param: string]: string } } } = {};
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader.postgresDbParamsPath)) {
            databaseParametersFromDb = await FileUtils.readJsonFile(DatabaseRepositoryReader.postgresDbParamsPath);


        }
        // loop through all of them, and ask to set or update
        for (let i = 0; i < databaseParams.length; i++) {
            const element = databaseParams[i];

            let value = '';
            if (databaseParametersFromDb &&
                databaseParametersFromDb[element.databaseName] &&
                databaseParametersFromDb[element.databaseName][env] &&
                databaseParametersFromDb[element.databaseName][env][element.paramName]) {
                value = databaseParametersFromDb[element.databaseName][env][element.paramName];
            }
            const paramValue = await LoggerUtils.question({
                origin: this._origin,
                text: `Please enter the value for ${colors.yellow(env)} - ${colors.green(element.databaseName)} - ${colors.cyan(element.paramName)} ${value ? `(current : "${value}") ` : ''}:`
            });
            if (paramValue) {
                if (!databaseParametersFromDb[element.databaseName]) {
                    databaseParametersFromDb[element.databaseName] = {};
                }
                if (!databaseParametersFromDb[element.databaseName][env]) {
                    databaseParametersFromDb[element.databaseName][env] = {};
                }
                databaseParametersFromDb[element.databaseName][env][element.paramName] = paramValue;
            } else {
                LoggerUtils.info({ origin: this._origin, message: 'No value provided => value not changed' });
            }
        }
        LoggerUtils.info({ origin: DatabaseRepositoryReader._origin, message: `Saving data in postgres params db file` });
        FileUtils.writeFileSync(DatabaseRepositoryReader.postgresDbParamsPath, JSON.stringify(databaseParametersFromDb, null, 2));
    }
}