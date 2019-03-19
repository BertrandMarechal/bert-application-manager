import { FileUtils } from "./file.utils";
import path from "path";
import { ServerlessRepositoryReader } from "../classes/serverless/serverless-repo-reader";
import { LoggerUtils } from "./logger.utils";
import { DatabaseRepositoryReader } from "../classes/database/database-repo-reader";
import { FrontendRepositoryReader } from "../classes/frontend/frontend-repo-reader";

export type RepositoryType = 'postgres' | 'serverless' | 'frontend';

export class RepositoryUtils {
    private static origin = 'RepositoryUtils';

    private static processFileName(fileName: string) {
        return fileName.replace(/[\/\/]|[\\\\]/g, '/');
    }
    static async readRepository (startPath: string, type: RepositoryType, subRepo: boolean = false) {
        let repoName = '';
        if (FileUtils.checkIfFolderExists(path.resolve(startPath, '.git'))) {
            const gitFileData = await FileUtils.readFile(path.resolve(startPath, '.git', 'config'));
            const repoUrlRegexResult = gitFileData.match(/\/.*?\.git$/gim);
            if (repoUrlRegexResult) {
                const repoUrlRegexResultSplit = repoUrlRegexResult[0].split(/\//);
                repoName = repoUrlRegexResultSplit[repoUrlRegexResultSplit.length - 1].replace('.git', '');
                LoggerUtils.info({ origin: 'RepositoryUtils', message: `Wotking with "${repoName}"` });
            }
        }
        if (!repoName) {
            if (!subRepo) {
                // check if the sub folders are git folders
                const gitFileList = await FileUtils.getFileList({
                    startPath: startPath,
                    maxLevels: 3,
                    filter: /\\\.git\\config$/
                });
                if (gitFileList.length > 0) {
                    for (let i = 0; i < gitFileList.length; i++) {
                        const subFolder = gitFileList[i].replace(/\/.git\/config$/, '');
                        
                        try {
                            await RepositoryUtils.readRepository(subFolder, type, true);
                        } catch (error) {
                            LoggerUtils.info({origin: this.origin, message: error});
                        }
                    }
                } else {
                    throw 'Please run this command in a git folder.';
                }
            } else {
                throw 'Please run this command in a git folder.';
            }
        } else {

            if (!type) {
                if (repoName.match(/\-middle\-tier$/g)) {
                    type = 'serverless';
                } else if (repoName.match(/\-database$/g)) {
                    type = 'postgres';
                } else if (repoName.match(/\-frontend$/g)) {
                    type = 'frontend';
                } else {
                    throw 'No repository type provided. Please ensure you provide it through the "--type (-t)" option';
                }
            }
            if (type === 'serverless') {
                await ServerlessRepositoryReader.readRepo(startPath, repoName);
            } else if (type === 'postgres') {
                await DatabaseRepositoryReader.readRepo(startPath, repoName);
            } else if (type === 'frontend') {
                await FrontendRepositoryReader.readRepo(startPath, repoName);
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