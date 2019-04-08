import { UiUtils } from "../../utils/ui.utils";
import { DatabaseVersionFile, DatabaseObject, DatabaseTable, DatabaseFile, DatabaseSubObject, DatabaseFunction } from "../../models/database-file.model";
import { DatabaseHelper } from "./database-helper";
import { RepositoryUtils } from "../../utils/repository.utils";
import { FileUtils } from "../../utils/file.utils";
import path from 'path';

export class DatabaseVersionChecker {
    private static _origin = 'DatabaseVersionChecker';

    static async checkVersion(params: {
        applicationName: string,
        version?: string
    }, uiUtils: UiUtils) {
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);
        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        const databaseFiles: DatabaseVersionFile[] = await DatabaseHelper.getApplicationDatabaseFiles(params.applicationName);
        if (!databaseObject || !databaseFiles) {
            throw 'Invalid application name';
        }
        if (params.version) {
            if (databaseObject._versions.indexOf(params.version) === -1) {
                throw 'Invalid version';
            }
        } else {
            params.version = databaseObject._versions[databaseObject._versions.length - 1];
        }

        uiUtils.info({message: `Checking tables for ${params.version}`, origin: this._origin});
        // we check if we have an alter table in the list of files
        // then check if we have the table script
        const scriptNames = Object.keys(databaseObject.script).map(key => databaseObject.script[key].latestFile);
        const modifiedTables: string[] = [];
        
        // we read the version's table folder
        const tableList = await FileUtils.getFileList({
            startPath: path.resolve(databaseObject._properties.path, 'postgres', 'release', params.version, 'schema', '03-tables'),
            filter: /\.sql/
        });
        const tableNamesFromtableScripts = tableList
            .map(table => table.split('/')[table.split('/').length - 1].split('.')[0]);

        for (let i = 0; i < scriptNames.length; i++) {
            const scriptName = scriptNames[i];
            const file = await FileUtils.readFile(scriptName);
            const alterTableRegExp = /alter\s+table\s+(?!if\s+exists\s+)(?!only\s+)([a-z0-9_]+)/gmi;
            let regexpResult = alterTableRegExp.exec(file);
            while (regexpResult && regexpResult[1]) {
                if (modifiedTables.indexOf(regexpResult[1]) === -1) {
                    modifiedTables.push(regexpResult[1]);
                }
                regexpResult = alterTableRegExp.exec(file);
            }
        }
        if (modifiedTables.length > 0) {
            // we check if we have missing table
            const missingTableScripts = modifiedTables
                .filter(table => tableNamesFromtableScripts.indexOf(table) === -1);
            if (missingTableScripts.length > 0) {
                uiUtils.error({message: `Missing table scripts for : ${missingTableScripts.join(', ')}`, origin: this._origin});
            }
        }

        if (tableNamesFromtableScripts.length > 0) {
            // if we have the table script, we check if we have the alter table
            const missingAlterScripts = tableNamesFromtableScripts
                .filter(table => !databaseObject.table[table])
                .filter(table => modifiedTables.indexOf(table) === -1);
            if (missingAlterScripts.length > 0) {
                uiUtils.error({message: `Missing alter table scripts for : ${missingAlterScripts.join(', ')}`, origin: this._origin});
            }
        }
    }
}