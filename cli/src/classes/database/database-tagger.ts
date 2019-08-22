import { DatabaseObject, DatabaseSubObject } from "../../models/database-file.model";
import { FileUtils } from "../../utils/file.utils";
import { DatabaseHelper } from './database-helper';
import { DatabaseRepositoryReader } from "./database-repo-reader";
import { RepositoryUtils } from "../../utils/repository.utils";
import { UiUtils } from "../../utils/ui.utils";

// const fieldSettingsRegex = '+([^(),]+\\([^,]\\)|[^(),]+)([^(),]+\\([^()]+\\)[^(),]?)?[^(),\\/*]+(\\/\\*[^\\/*]+\\*\\/)?)[,)]';
export const fieldSettingsRegex = '+([^(),]+\\([^,]\\)|[^(),]+)(\\([^()]+\\))?[^(),\\/*]*(\\/\\*[^\\/*]+\\*\\/)?)[,)]';

export class DatabaseTagger {
    private static _origin = 'DatabaseTagger';
    static async addTagOnTable(params: {
        applicationName: string;
        objectName: string;
        tagName: string;
        tagValue: string;
    }, uiUtils: UiUtils) {
        uiUtils.info({ origin: this._origin, message: `Getting ready to edit object.` });
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);

        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        const databaseSubObject: DatabaseSubObject =
            await DatabaseHelper.getDatabaseSubObject({ ...params, objectType: 'table' }, databaseObject, DatabaseTagger._origin, uiUtils);

        let fileString = await FileUtils.readFile(databaseSubObject.latestFile);
        if (/\/\*[^*\/]+\*\/[^"]*TABLE/im.test(fileString)) {
            // in that case, we already have tags
            if (!new RegExp(`#${params.tagName}[^"]*TABLE`).test(fileString)) {
                // but we don't have the one we're looking for
                fileString = fileString.replace(/\/\*([^*\/]+)\*\//im, `/*$1 #${params.tagName}${params.tagValue ? '=' + params.tagValue : ''} */`);
            } else if (params.tagValue) {
                // we the replace what we have to replace
                fileString = fileString.replace(new RegExp(`#${params.tagName}[^#]+ ?([\#\*])`), `#${params.tagName}=${params.tagValue} $1`);
            } else if (new RegExp(`#${params.tagName}=[^"]*TABLE`).test(fileString)) {
                // we had a value, we don't have one anymore
                fileString = fileString.replace(new RegExp(`#${params.tagName}[^#\*]+ ?([\#\*])`), `#${params.tagName} $1`);
            }
        } else {
            fileString = `/* #${params.tagName}${params.tagValue ? '=' + params.tagValue : ''} */\n` + fileString;
        }

        FileUtils.writeFileSync(databaseSubObject.latestFile, fileString);
        await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
    }

    static async removeTagFromTable(params: {
        applicationName: string;
        objectName: string;
        tagName: string;
    }, uiUtils: UiUtils) {
        uiUtils.info({ origin: this._origin, message: `Getting ready to edit object.` });
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);

        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        const databaseSubObject: DatabaseSubObject =
            await DatabaseHelper.getDatabaseSubObject({ ...params, objectType: 'table' }, databaseObject, DatabaseTagger._origin, uiUtils);

        let fileString = await FileUtils.readFile(databaseSubObject.latestFile);
        if (/\/\*[^*\/]+\*\/[^"]*TABLE/im.test(fileString)) {
            // in that case, we already have tags
            if (new RegExp(`#${params.tagName}[^"]*TABLE`, 'i').test(fileString)) {
                fileString = fileString.replace(new RegExp(`#${params.tagName}[^#\*]+ ?([\#\*])`), `$1`);
            }
        }

        FileUtils.writeFileSync(databaseSubObject.latestFile, fileString);
        await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
    }
    static async addTagOnField(params: {
        applicationName: string;
        objectName: string;
        fieldName: string;
        tagName: string;
        tagValue: string;
    }, uiUtils: UiUtils) {
        uiUtils.info({ origin: this._origin, message: `Getting ready to edit object.` });
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);

        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        const databaseSubObject: DatabaseSubObject =
            await DatabaseHelper.getDatabaseSubObject({ ...params, objectType: 'table' }, databaseObject, DatabaseTagger._origin, uiUtils);

        let fileString = await FileUtils.readFile(databaseSubObject.latestFile);
        // look for our field's text
        const fieldRegexCaptured = new RegExp(`(${params.fieldName} ${fieldSettingsRegex}`, 'i')
            .exec(fileString);
        if (fieldRegexCaptured && fieldRegexCaptured[1]) {
            const tagToPut = `#${params.tagName}${params.tagValue ? '=' + params.tagValue : ''}`;
            // we got our tield
            const fieldText = fieldRegexCaptured[1];
            const tags = fieldRegexCaptured[4];

            if (tags) {
                if (!new RegExp(`#${params.tagName}[=\s]`, 'i').test(tags)) {
                    // but we don't have the one we're looking for
                    fileString = fileString.replace(fieldText, fieldText.replace(
                        tags,
                        tags.replace('*/', `${tagToPut} */`)
                    ));
                } else {
                    // we replace the tag
                    fileString = fileString.replace(fieldText, fieldText.replace(
                        tags,
                        tags.replace(new RegExp(`#${params.tagName}[^#]+ ?([\#\*])`), `${tagToPut} $1`)
                    ));
                }
            } else {
                // no tags
                fileString = fileString.replace(fieldText, fieldText + ` /* ${tagToPut} */`);
            }
        } else {
            throw `Invalid field name (${params.fieldName})`;
        }


        FileUtils.writeFileSync(databaseSubObject.latestFile, fileString);
        await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
    }
    static async removeTagFromField(params: {
        applicationName: string;
        objectName: string;
        fieldName: string;
        tagName: string;
    }, uiUtils: UiUtils) {
        uiUtils.info({ origin: this._origin, message: `Getting ready to edit object.` });
        await RepositoryUtils.checkOrGetApplicationName(params, 'database', uiUtils);

        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(params.applicationName);
        const databaseSubObject: DatabaseSubObject =
            await DatabaseHelper.getDatabaseSubObject({ ...params, objectType: 'table' }, databaseObject, DatabaseTagger._origin, uiUtils);

        let fileString = await FileUtils.readFile(databaseSubObject.latestFile);
        // look for our field's text
        const fieldRegexCaptured = new RegExp(`(${params.fieldName} ${fieldSettingsRegex}`, 'i')
            .exec(fileString);

        if (fieldRegexCaptured) {
            // we got our tield
            const fieldText = fieldRegexCaptured[1];
            const tags = fieldRegexCaptured[4];

            if (tags) {
                // in that case, we already have tags
                fileString = fileString.replace(
                    fieldText,
                    fieldText.replace(
                        tags,
                        tags.replace(
                            new RegExp(`#${params.tagName}[^#]+ ?([\#\*])`), `$1`
                        )
                    )
                );
            }
        } else {
            throw 'Invalid field name';
        }

        FileUtils.writeFileSync(databaseSubObject.latestFile, fileString);
        await DatabaseRepositoryReader.readRepo(databaseObject._properties.path, params.applicationName, uiUtils);
    }
}