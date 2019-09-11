import { FileUtils } from "../../utils/file.utils";
import { DatabaseHelper } from '../database/database-helper';

export class CliFiles {
    static openDbDataFile() {
        FileUtils.openFileInFileEditor(DatabaseHelper.postgresDbDataPath);
    }
    static openFilesFolder() {
        FileUtils.openFolderInExplorer();
    }
}