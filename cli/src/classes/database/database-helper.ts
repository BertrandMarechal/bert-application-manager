import path from 'path';
import { DatabaseVersionFile, DatabaseObject, DatabaseTable, DatabaseSubObject } from "../../models/database-file.model";
import { FileUtils } from '../../utils/file.utils';
import { UiUtils } from '../../utils/ui.utils';

export class DatabaseHelper {
    static dbTemplatesFolder = path.resolve(process.argv[1], '../../data/db/templates');
    static dbFolderStructureFolder = path.resolve(process.argv[1], '../../data/db/database-structure');
    static tempFolderPath = path.resolve(process.argv[1], '../../../temp');
    static postgresDbFilesPath = DatabaseHelper.tempFolderPath + '/postgres-dbs.json';
    static postgresDbParamsPath = DatabaseHelper.tempFolderPath + '/postgres-db-params.json';
    static postgresDbDataPath = DatabaseHelper.tempFolderPath + '/postgres-db-data.json';
    static releasesPath = 'postgres/release';

    static async getApplicationDatabaseObject(applicationName: string): Promise<DatabaseObject> {
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let fileData: { [name: string]: DatabaseObject } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbDataPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseHelper.postgresDbDataPath);
        }
        let toReturn: DatabaseObject;
        if (applicationName.match(/-database$/i)) {
            toReturn = fileData[applicationName];
        } else {
            // we might be trying to get the database from its suffix
            // let's map the db to those, and check if ours exists
            const databaseMapping: { [name: string]: string } = Object.keys(fileData)
                .reduce((agg: { [name: string]: string }, curr: string) => {
                    if (fileData[curr]._properties && fileData[curr]._properties.dbName) {
                        agg[fileData[curr]._properties.dbName] = curr;
                    }
                    return agg;
                }, {});
            toReturn = fileData[databaseMapping[applicationName]];
        }
        if (toReturn) {
            return toReturn;
        }
        throw 'This application does not exist';
    }

    static async getDatabaseSubObject(params: {
        objectName: string;
        objectType?: string;
    }, databaseObject: DatabaseObject, origin: string, uiUtils: UiUtils): Promise<DatabaseSubObject> {
        let databaseSubObject: DatabaseSubObject | null = null;
        if (params.objectType) {
            if (!databaseObject[params.objectType]) {
                uiUtils.warning({
                    origin,
                    message: `invalid object type. The search for this object will be ran on all objects`
                });
            } else {
                databaseSubObject = databaseObject[params.objectType][params.objectName];
            }
        } else {
            uiUtils.warning({
                origin,
                message: `No type provided. Next time please pass the object type with the --type (-y) option fo the search to go quicker.`
            });
        }

        if (!databaseSubObject) {
            // we will here loop through the objects, and try to find it with full name first
            const objectKeys = Object.keys(databaseObject);
            const partials: {
                type: string;
                name: string;
            }[] = [];
            for (let i = 0; i < objectKeys.length && !databaseSubObject; i++) {
                const objectKey = objectKeys[i];
                const typeKeys = Object.keys(databaseObject[objectKey]);
                for (let j = 0; j < typeKeys.length && !databaseSubObject; j++) {
                    const typeKey = typeKeys[j];
                    if (typeKey === params.objectName) {
                        params.objectType = objectKey;
                        databaseSubObject = databaseObject[params.objectType][params.objectName];
                    } else if (typeKey.indexOf(params.objectName) > -1) {
                        partials.push({
                            name: typeKey,
                            type: objectKey
                        });
                    }
                }
            }
            if (!databaseSubObject) {
                if (partials.length > 15) {
                    uiUtils.error({
                        origin,
                        message: `More than 15 objects were found with those parameters, please narrow done the name and retry.`
                    });
                    throw '';
                } else if (partials.length > 1) {
                    const choice = await uiUtils.choices({
                        title: 'Objects Found',
                        message: `${partials.length} objects were found containing this name. which one do you want to edit?`,
                        choices: partials.map(x => `${x.type} - ${x.name}`)
                    });
                    const [type, name] = choice['Objects Found'].split(' - ');
                    params.objectType = type;
                    params.objectName = name;
                    databaseSubObject = databaseObject[params.objectType][params.objectName];
                } else if (partials.length === 1) {
                    params.objectType = partials[0].type;
                    params.objectName = partials[0].name;
                    databaseSubObject = databaseObject[params.objectType][params.objectName];
                }

            }
        }

        if (!databaseSubObject) {
            throw 'This object does not exist';
        }
        return databaseSubObject;
    }

    static async getApplicationDatabaseObjects(): Promise<{ [dbName: string]: DatabaseObject }> {
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let fileData: { [name: string]: DatabaseObject } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbDataPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseHelper.postgresDbDataPath);
        }
        return fileData;
    }

    static async getApplicationDatabaseParameters(applicationName: string): Promise<{ [env: string]: { [param: string]: string } }> {
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let fileParameters: { [database: string]: { [env: string]: { [param: string]: string } } } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbParamsPath)) {
            fileParameters = await FileUtils.readJsonFile(DatabaseHelper.postgresDbParamsPath);
        }
        return fileParameters[applicationName];
    }

    static async getApplicationDatabaseFiles(applicationName: string): Promise<DatabaseVersionFile[]> {
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let fileData: { [name: string]: DatabaseVersionFile[] } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbFilesPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseHelper.postgresDbFilesPath);
        }
        return fileData[applicationName];
    }

    static async getApplicationDatabaseFile(applicationName: string, version: string): Promise<DatabaseVersionFile | undefined> {
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let fileData: { [name: string]: DatabaseVersionFile[] } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbFilesPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseHelper.postgresDbFilesPath);
        }
        if (fileData[applicationName]) {
            return fileData[applicationName].find(versionFile => versionFile.versionName === version);
        }
    }

    static async updateApplicationDatabaseObject(applicationName: string, data: DatabaseObject) {
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let fileData: { [name: string]: DatabaseObject } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbDataPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseHelper.postgresDbDataPath);
        }
        fileData[applicationName] = data;
        FileUtils.writeFileSync(DatabaseHelper.postgresDbDataPath, JSON.stringify(fileData, null, 2));
    }

    static async updateApplicationDatabaseFiles(applicationName: string, data: DatabaseVersionFile[]) {
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let fileData: { [name: string]: DatabaseVersionFile[] } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbFilesPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseHelper.postgresDbFilesPath);
        }
        fileData[applicationName] = data;
        FileUtils.writeFileSync(DatabaseHelper.postgresDbFilesPath, JSON.stringify(fileData, null, 2));
    }

    static async updateApplicationDatabaseParameters(applicationName: string, data: { [env: string]: { [param: string]: string } }) {
        FileUtils.createFolderStructureIfNeeded(DatabaseHelper.tempFolderPath);
        let fileData: { [database: string]: { [env: string]: { [param: string]: string } } } = {};
        if (FileUtils.checkIfFolderExists(DatabaseHelper.postgresDbParamsPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseHelper.postgresDbParamsPath);
        }
        fileData[applicationName] = data;
        FileUtils.writeFileSync(DatabaseHelper.postgresDbParamsPath, JSON.stringify(fileData, null, 2));
    }
}