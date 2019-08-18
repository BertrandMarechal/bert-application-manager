import { FileUtils } from "../../utils/file.utils";
import path from 'path';
import colors from 'colors';
import { DatabaseVersionFile, DatabaseObject, DatabaseTable, DatabaseFile, DatabaseSubObject, DatabaseFunction, DatabaseDataScript, DatabaseLocalReplicatedTable } from "../../models/database-file.model";
import { DatabaseHelper } from "./database-helper";
import { UiUtils } from "../../utils/ui.utils";
import { RepositoryUtils } from "../../utils/repository.utils";
import { ServerUtils } from "../../utils/server.utils";

interface DatabaseStructureNode {
    fileName?: string;
    fileSource?: string;
    folderName?: string;
    children?: DatabaseStructureNode[];
}
const acceptableVersionRegExp = /^current$|^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/i;

export class DatabaseRepositoryReader {
    private static _origin = 'DatabaseRepositoryReader';
    static async readRepo(startPath: string, applicationName: string, uiUtils: UiUtils, silent?: boolean) {
        // we have to get the list of files and read them
        const versionFiles = await FileUtils.getFileList({
            startPath: path.resolve(startPath, DatabaseHelper.releasesPath),
            filter: /version.json$/
        });


        // read all the SQL files, to see if they are all in the installation scripts
        const fileList = (await FileUtils.getFileList({
            filter: /\.sql$/,
            startPath: path.resolve(startPath, DatabaseHelper.releasesPath)
        })).map(x => x.replace(FileUtils.replaceSlashes(startPath), '../'));
        // read the current db files file and add on
        const databaseFiles: DatabaseVersionFile[] = await DatabaseRepositoryReader._readFiles(
            versionFiles,
            fileList
        )
        await DatabaseHelper.updateApplicationDatabaseFiles(applicationName, databaseFiles);

        // read the current db objects file and add on
        const databaseObject: DatabaseObject = await DatabaseRepositoryReader._extractObjectInformation(
            await DatabaseHelper.getApplicationDatabaseFiles(applicationName),
            startPath,
            uiUtils
        );
        await DatabaseHelper.updateApplicationDatabaseObject(applicationName, databaseObject);
        await ServerUtils.somethingChanged(applicationName);
    }

    static async initDatabase(params: {
        applicationName: string;
    }, uiUtils: UiUtils) {
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);

        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        let dbName = '';
        let currentPath = path.resolve(process.cwd());
        if (databaseObject) {
            currentPath = databaseObject._properties.path;
            if (FileUtils.checkIfFolderExists(path.resolve(currentPath, 'postgres', 'release'))) {
                const response = await uiUtils.question({
                    text: 'There is already a version in this folder. Are you sure you want to override ? (y/n)',
                    origin: DatabaseRepositoryReader._origin
                });
                if (response.toLowerCase() !== 'y') {
                    throw 'Application forlder is not null';
                }
            }
            dbName = databaseObject._properties.dbName;
        }

        if (!dbName) {
            while (!DatabaseRepositoryReader._isDatabaseNameValid(dbName)) {
                dbName = await uiUtils.question({
                    text: 'Please provide a 2 / 3 letter prefix for your database',
                    origin: DatabaseRepositoryReader._origin
                });
            }
        }
        // we create the folder structure, and the default files
        const dbStructure: DatabaseStructureNode = await FileUtils.readJsonFile(
            path.resolve(DatabaseHelper.dbFolderStructureFolder, 'folder-structure.json')
        );
        await DatabaseRepositoryReader._createDBFolderStructure(dbStructure, currentPath, dbName);
        uiUtils.success({ origin: DatabaseRepositoryReader._origin, message: `Database structure created for ${dbName}` });
        await DatabaseRepositoryReader.readRepo(currentPath, params.applicationName, uiUtils, true);
    }

    private static _isDatabaseNameValid(name: string) {
        if (!name) {
            return false;
        }
        // todo check the other db names
        return /^[a-z][a-z0-9]{1,2}$/gi.test(name);
    }


    private static async _createDBFolderStructure(node: DatabaseStructureNode, folderPath: string, dbName: string) {
        if (node.folderName) {
            const newFolderPath = path.resolve(folderPath, node.folderName);
            FileUtils.createFolderStructureIfNeeded(newFolderPath);
            if (node.children && node.children.length > 0) {
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    await DatabaseRepositoryReader._createDBFolderStructure(child, newFolderPath, dbName);
                }
            } else {
                FileUtils.writeFileSync(path.resolve(newFolderPath, '.placeholder'), '');
            }
        } else if (node.fileName) {
            let fileContent = '';
            if (node.fileSource) {
                fileContent = await FileUtils.readFile(
                    path.resolve(DatabaseHelper.dbFolderStructureFolder, 'files', node.fileSource)
                );
                if (fileContent) {
                    fileContent = fileContent.replace(/<db>/gi, dbName);
                }
            }
            FileUtils.writeFileSync(path.resolve(folderPath, node.fileName.replace('<db>', dbName)), fileContent);
        }
    }

    static async updateVersionFile(params: {
        applicationName: string;
        version: string;
    }, uiUtils: UiUtils) {
        if (!params.version) {
            throw 'Please provide a version.';
        }
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);

        const databaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        if (!databaseObject) {
            throw 'Please run the read repo command before running this command.';
        }

        const fileList = (await FileUtils.getFileList({
            filter: /\.sql/,
            startPath: path.resolve(databaseObject._properties.path, 'postgres', 'release', params.version)
        }));

        // read the files, see if they have dependencies
        const replacedPath = path.resolve(databaseObject._properties.path, 'postgres', 'release', params.version);
        const newDBObject: DatabaseObject = await DatabaseRepositoryReader._extractObjectInformation([{
            versionName: params.version,
            fileName: params.version,
            versions: [{
                userToUse: 'root',
                files: fileList
                    .map(filePath => new DatabaseFile(
                        databaseObject._properties.path,
                        filePath.replace(replacedPath, '../postgres/')
                    )),
                fileList: fileList,
                databaseToUse: ''
            }],
        }], databaseObject._properties.path, uiUtils);

        const versionFileList: string[] = [];
        // order the objects
    }

    private static async _readFiles(files: string[], allFiles: string[]): Promise<DatabaseVersionFile[]> {
        const filesRead = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileData = await FileUtils.readJsonFile(file);
            filesRead.push(new DatabaseVersionFile(file, fileData, allFiles));
        }
        return filesRead;
    }

    private static async _processVersionFile(
        databaseFile: DatabaseVersionFile,
        databaseObject: DatabaseObject,
        sqlFile: DatabaseFile,
        unmapped: boolean) {

        if (sqlFile.type !== 'unknown') {
            if (!databaseObject[sqlFile.type]) {
                databaseObject[sqlFile.type] = {};
            }
            if (!databaseObject[sqlFile.type][sqlFile.objectName]) {
                databaseObject[sqlFile.type][sqlFile.objectName] = new DatabaseSubObject();
            }
            databaseObject[sqlFile.type][sqlFile.objectName].name = sqlFile.objectName;
            databaseObject[sqlFile.type][sqlFile.objectName].latestFile = sqlFile.fileName;
            databaseObject[sqlFile.type][sqlFile.objectName].latestVersion = databaseFile.versionName;
            databaseObject[sqlFile.type][sqlFile.objectName].versions.push({
                file: sqlFile.fileName,
                version: databaseFile.versionName
            });
        }
    }
    private static async _extractObjectInformation(databaseFiles: DatabaseVersionFile[], path: string, uiUtils: UiUtils): Promise<DatabaseObject> {
        databaseFiles = databaseFiles.filter(x => x.versionName.match(acceptableVersionRegExp));
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
            if (databaseObject._versions.indexOf(databaseFile.versionName) === -1) {
                databaseObject._versions.push(databaseFile.versionName);
            }
            databaseFile.versions.forEach(version => {
                version.files.forEach(file => DatabaseRepositoryReader._processVersionFile(
                    databaseFile,
                    databaseObject,
                    file,
                    false
                ));
                (version.unmappedFiles || []).forEach(file => DatabaseRepositoryReader._processVersionFile(
                    databaseFile,
                    databaseObject,
                    file,
                    true
                ));
            });
        });
        const filesToAnalyzeLength =
            Object.keys(databaseObject.table).length +
            Object.keys(databaseObject.function).length +
            Object.keys(databaseObject.data).length;
        if (filesToAnalyzeLength > 0) {
            uiUtils.startProgress({
                length: filesToAnalyzeLength,
                start: 0,
                title: 'Analyzing files'
            });
            let i = 0;
            if (Object.keys(databaseObject.table).length > 0) {
                const keys = Object.keys(databaseObject.table);
                for (let j = 0; j < keys.length; j++) {
                    const key = keys[j];
                    uiUtils.progress(++i);
                    databaseObject.table[key] = new DatabaseTable(databaseObject.table[key]);
                    await databaseObject.table[key].analyzeFile(uiUtils);
                }
            }
            if (Object.keys(databaseObject.function).length > 0) {
                const keys = Object.keys(databaseObject.function);
                for (let j = 0; j < keys.length; j++) {
                    const key = keys[j];
                    uiUtils.progress(++i);
                    databaseObject.function[key] = new DatabaseFunction(databaseObject.function[key]);
                    await databaseObject.function[key].analyzeFile(uiUtils);
                }
            }
            if (Object.keys(databaseObject['local-tables']).length > 0) {
                const keys = Object.keys(databaseObject['local-tables']);
                for (let j = 0; j < keys.length; j++) {
                    const key = keys[j];
                    uiUtils.progress(++i);
                    databaseObject['local-tables'][key] = new DatabaseLocalReplicatedTable(databaseObject['local-tables'][key]);
                    await databaseObject['local-tables'][key].analyzeFile(uiUtils);
                }
            }
            if (Object.keys(databaseObject.data).length > 0) {
                const keys = Object.keys(databaseObject.data);
                for (let j = 0; j < keys.length; j++) {
                    const key = keys[j];
                    uiUtils.progress(++i);
                    databaseObject.data[key] = new DatabaseDataScript(databaseObject.data[key]);
                    await databaseObject.data[key].analyzeFile(uiUtils);
                }
            }
            uiUtils.stoprProgress();
        }


        // get the db name from the drop script if we have one
        if (databaseObject.setup['01-drop-database']) {
            const fileContent = await FileUtils.readFile(databaseObject.setup['01-drop-database'].latestFile);
            const dbMatched = fileContent.match(/\<env\>_[a-z][a-z0-9]{1,2}/i);
            if (dbMatched) {
                databaseObject._properties.dbName = dbMatched[0].replace('<env>_', '');
            }
        }
        // latest version
        const latestVersionNWithoutCurrent = databaseFiles.filter(x => x.versionName !== 'current');
        if (latestVersionNWithoutCurrent.length) {
            databaseObject._properties.lastVersion = latestVersionNWithoutCurrent[latestVersionNWithoutCurrent.length - 1].versionName;
        }


        if (!databaseObject._properties.dbName &&
            Object.keys(databaseObject.table).length > 0
            && Object.keys(databaseObject.table)[0].match(/^([a-z]{2,4})t_/)) {
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

        uiUtils.startProgress({
            length: filesToAnalyzeLength,
            start: 0,
            title: 'Read the files to check for parameters'
        });
        for (let i = 0; i < filesToWatch.length; i++) {
            uiUtils.progress(i + 1);
            const element = filesToWatch[i];
            if (FileUtils.checkIfFolderExists(element)) {
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
        }
        uiUtils.stoprProgress();
        databaseObject._parameters = variablesPerFiles;
        databaseObject._properties.path = path;

        return databaseObject;
    }

    static async checkParams(params: {
        filter: string,
        environment: string
    }, uiUtils: UiUtils) {
        if (!params.environment) {
            uiUtils.warning({ origin: DatabaseRepositoryReader._origin, message: 'No environment provided, the check will be ran for local' });
            params.environment = 'local';
        }
        // get the database parameters
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let fileDataDatabaseObject: { [name: string]: DatabaseObject } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbDataPath)) {
            fileDataDatabaseObject = await FileUtils.readJsonFile(DatabaseHelper.postgresDbDataPath);
        }
        let databasesToCheck = Object.keys(fileDataDatabaseObject);

        // filter them if needed
        if (params.filter) {
            databasesToCheck = databasesToCheck.filter(x => x.indexOf(params.filter) > -1);
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
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let databaseParametersFromDb: { [database: string]: { [env: string]: { [param: string]: string } } } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbParamsPath)) {
            databaseParametersFromDb = await FileUtils.readJsonFile(DatabaseHelper.postgresDbParamsPath);


        }
        // loop through all of them, and ask to set or update
        for (let i = 0; i < databaseParams.length; i++) {
            const element = databaseParams[i];

            let value = '';
            if (databaseParametersFromDb &&
                databaseParametersFromDb[element.databaseName] &&
                databaseParametersFromDb[element.databaseName][params.environment] &&
                databaseParametersFromDb[element.databaseName][params.environment][element.paramName]) {
                value = databaseParametersFromDb[element.databaseName][params.environment][element.paramName];
            }
            const paramValue = await uiUtils.question({
                origin: DatabaseRepositoryReader._origin,
                text: `Please enter the value for ${colors.yellow(params.environment)} - ${colors.green(element.databaseName)} - ${colors.cyan(element.paramName)} ${value ? `(current : "${value}") ` : ''}:`
            });
            if (paramValue) {
                if (!databaseParametersFromDb[element.databaseName]) {
                    databaseParametersFromDb[element.databaseName] = {};
                }
                if (!databaseParametersFromDb[element.databaseName][params.environment]) {
                    databaseParametersFromDb[element.databaseName][params.environment] = {};
                }
                databaseParametersFromDb[element.databaseName][params.environment][element.paramName] = paramValue;
            } else {
                uiUtils.info({ origin: DatabaseRepositoryReader._origin, message: 'No value provided => value not changed' });
            }
        }
        uiUtils.info({ origin: DatabaseRepositoryReader._origin, message: `Saving data in postgres params db file` });
        FileUtils.writeFileSync(DatabaseHelper.postgresDbParamsPath, JSON.stringify(databaseParametersFromDb, null, 2));
    }

    static analyzeDataFile(params: {
        path: String
    }, uiUtils: UiUtils) {
        uiUtils.info({ origin: this._origin, message: `Analyzing data file.` });

    }
}