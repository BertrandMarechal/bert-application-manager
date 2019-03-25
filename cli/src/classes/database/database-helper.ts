import path from 'path';
import { DatabaseVersionFile, DatabaseObject, DatabaseTable } from "../../models/database-file.model";
import { FileUtils } from '../../utils/file.utils';

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
        return fileData[applicationName];
    }

    static async getApplicationDatabaseObjects(): Promise<{[dbName: string]: DatabaseObject}> {
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