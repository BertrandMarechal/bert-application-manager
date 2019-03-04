import { FileUtils } from "./file.utils";
import path from "path";
import { ServerlessRepositoryReader } from "../classes/serverless-repo-reader";
import { LoggerUtils } from "./logger.utils";
import { DatabaseRepositoryReader } from "../classes/database-repo-reader";

export type RepositoryType = 'postgres' | 'serverless';

export class RepositoryUtils {

    private static processFileName(fileName: string) {
        return fileName.replace(/[\/\/]|[\\\\]/g, '/');
    }
    static async readRepository (startPath: string, type: RepositoryType) {
        let repoName = '';
        if (FileUtils.checkIfFolderExists(path.resolve(startPath, '.git'))) {
            const gitFileData = await FileUtils.readFile(path.resolve(startPath, '.git', 'config'));
            const repoUrlRegexResult = gitFileData.match(/\/.*?\.git$/gim);
            if (repoUrlRegexResult) {
                const repoUrlRegexResultSplit = repoUrlRegexResult[0].split(/\//);
                repoName = repoUrlRegexResultSplit[repoUrlRegexResultSplit.length - 1].replace('.git', '');
                LoggerUtils.info({ origin: 'RepositoryUtils', message: `Repo name is "${repoName}"` });
            }
        }
        if (!repoName) {
            throw 'Please run this command in a git folder.';
        } else {

            if (!type) {
                if (repoName.match(/\-middle\-tier$/g)) {
                    type = 'serverless';
                } else if (repoName.match(/\-database$/g)) {
                    type = 'postgres';
                } else {
                    throw 'No repository type provided. Please ensure you provide it through the "--type (-t)" option';
                }
            }
            if (type === 'serverless') {
                ServerlessRepositoryReader.readRepo(startPath, repoName);
            } else {
                DatabaseRepositoryReader.readRepo(startPath, repoName);
            }
        }
    }

    static async checkDbParams(filter: string, environment: string) {
        await DatabaseRepositoryReader.checkParams(filter, environment);
    }

    static async listFunctions(filter: string) {
        await ServerlessRepositoryReader.listFunctions(filter);
    }
}