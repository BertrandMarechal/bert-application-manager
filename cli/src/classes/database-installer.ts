import { DatabaseVersionFile } from "../models/database-file.model";
import { DatabaseRepositoryReader } from "./database-repo-reader";
import { FileUtils } from "../utils/file.utils";
import { LoggerUtils } from "../utils/logger.utils";

export class DatabaseInstaller {
    private static _origin = 'DatabaseRepositoryReader';
    
    static async installDatabse(params: {
        applicationName: string;
        environment: string;
        version: string;
    }) {
        if (!params.environment) {
            LoggerUtils.warning({origin: this._origin, message: 'No environment provided, the installation will be ran for local'});
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
        const databaseData = fileData[params.applicationName];
        if (!databaseData) {
            throw 'Invalid application name. Please run the "read-repo" command in the desired folder beforehand.';
        }
        let versionsToInstall: DatabaseVersionFile[]  = [];
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
        console.log(versionsToInstall.map(x => x.versionName));
        
    }
}