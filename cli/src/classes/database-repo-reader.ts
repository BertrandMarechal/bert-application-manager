import { FileUtils } from "../utils/file.utils";
import { LoggerUtils } from "../utils/logger.utils";
import path from 'path';
import { DatabaseVersionFile, DatabaseObject } from "../models/database-file.model";

export class DatabaseRepositoryReader {
    private static _origin = 'DatabaseRepositoryReader';
    private static _tempFolderPath = path.resolve(process.argv[1], '../../../temp');
    private static _postgresDbFilesPath = DatabaseRepositoryReader._tempFolderPath + '/postgres-dbs.json';
    private static _postgresDbDataPath = DatabaseRepositoryReader._tempFolderPath + '/postgres-db-data.json';
    private static _releasesPath = 'postgres/release';

    static async readRepo(startPath: string, repoName: string) {
        // we have to get the list of files and read them
        const versionFiles = await FileUtils.getFileList({
            startPath: path.resolve(startPath, DatabaseRepositoryReader._releasesPath),
            filter: /version.json$/
        });
        LoggerUtils.info({ origin: DatabaseRepositoryReader._origin, message: `${versionFiles.length} files found` });
        
        // read the current db file and add on
        FileUtils.createFolderStructureIfNeeded(DatabaseRepositoryReader._tempFolderPath);
        let fileData: { [name: string]: DatabaseVersionFile[] } = {};
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader._postgresDbFilesPath)) {
            fileData = await FileUtils.readJsonFile(DatabaseRepositoryReader._postgresDbFilesPath);
        }
        fileData[repoName] = await DatabaseRepositoryReader._readFiles(versionFiles);
        LoggerUtils.info({ origin: DatabaseRepositoryReader._origin, message: `Saving data in postgres db file` });
        FileUtils.writeFileSync(DatabaseRepositoryReader._postgresDbFilesPath, JSON.stringify(fileData, null, 2));

        // read the current db file and add on
        FileUtils.createFolderStructureIfNeeded(DatabaseRepositoryReader._tempFolderPath);
        let fileData2: { [name: string]: DatabaseObject } = {};
        if (FileUtils.checkIfFolderExists(DatabaseRepositoryReader._postgresDbDataPath)) {
            fileData2 = await FileUtils.readJsonFile(DatabaseRepositoryReader._postgresDbDataPath);
        }
        fileData2[repoName] = await DatabaseRepositoryReader._extractObjectInformation(fileData[repoName]);
        LoggerUtils.info({ origin: DatabaseRepositoryReader._origin, message: `Saving data in postgres objects db file` });
        FileUtils.writeFileSync(DatabaseRepositoryReader._postgresDbDataPath, JSON.stringify(fileData2, null, 2));
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

    private static async _extractObjectInformation(databaseFiles: DatabaseVersionFile[]): Promise<DatabaseObject> {
        databaseFiles = databaseFiles.filter(x => x.versionName === 'current' || x.versionName.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/));
        databaseFiles.sort((a, b) => {
            let vA = 0, vB = 0;
            if (a.versionName === 'current') {
                vA = Infinity;
            } else {
                vA = +a.versionName
                    .split('.')
                    .map((x, i) => +x + 1000)
                    .reduce((agg, curr) => `${agg}${curr}`,'');
            }
            if (b.versionName === 'current') {
                vB = Infinity;
            } else {
                vB = +b.versionName
                    .split('.')
                    .map((x, i) => +x + 1000)
                    .reduce((agg, curr) => `${agg}${curr}`,'');
            }
            return vA - vB;
        });
        const databaseObject: DatabaseObject = new DatabaseObject();
        databaseFiles.forEach(databaseFile => {
            if (databaseFile.versionName === 'current') {
                databaseObject._parameters.hasCurrent = true;
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
                                versions:[{
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
        if (Object.keys(databaseObject.table).length > 0 && Object.keys(databaseObject.table)[0].match(/^([a-z]{2,4})t_/)) {
            const dbNameRegex = /^([a-z]{2,4})t_/g.exec(Object.keys(databaseObject.table)[0]);
            if (dbNameRegex) {
                databaseObject._parameters.dbName = dbNameRegex[1];
            }
        }
        return databaseObject;
    }


}