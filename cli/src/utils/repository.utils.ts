import { FileUtils } from "./file.utils";
import path from "path";
import { ServerlessRepositoryReader } from "../classes/serverless/serverless-repo-reader";
import { DatabaseRepositoryReader } from "../classes/database/database-repo-reader";
import { FrontendRepositoryReader } from "../classes/frontend/frontend-repo-reader";
import { UiUtils } from "./ui.utils";

export type RepositoryType = 'postgres' | 'serverless' | 'frontend';

export class RepositoryUtils {
    private static origin = 'RepositoryUtils';

    static async checkOrGetApplicationName(params: {applicationName: string}, type: string, uiUtils: UiUtils) {
        if (!params.applicationName) {
            params.applicationName = await RepositoryUtils.getRepoName(uiUtils);
            if (!params.applicationName) {
                throw 'No application name provided, please use the -an parameter.';
            }
        }
        if (type && !params.applicationName.match(new RegExp(`\-${type}$`))) {
            if (params.applicationName.match(/-database$|-frontend$|-middle-tier$/)) {
                params.applicationName = params.applicationName.replace(/database$|frontend$|middle-tier$/, type);
            } else {
                params.applicationName += `-${type}`;
            }
        }
    }

    static async getRepoName(uiUtils: UiUtils, startPath?: string): Promise<string> {
        let repoName = '';        
        startPath = startPath || path.resolve(process.cwd());
        if (FileUtils.checkIfFolderExists(path.resolve(startPath, '.git'))) {
            const gitFileData = await FileUtils.readFile(path.resolve(startPath, '.git', 'config'));
            const repoUrlRegexResult = gitFileData.match(/\/.*?\.git$/gim);
            if (repoUrlRegexResult) {
                const repoUrlRegexResultSplit = repoUrlRegexResult[0].split(/\//);
                repoName = repoUrlRegexResultSplit[repoUrlRegexResultSplit.length - 1].replace('.git', '');
                uiUtils.info({ origin: 'RepositoryUtils', message: `Wotking with "${repoName}"` });
            }
        }
        return repoName;
    }

    static async readRepository (params: {
        startPath?: string,
        type: RepositoryType,
        subRepo?: boolean
    }, uiUtils: UiUtils) {
        params.startPath = FileUtils.replaceSlashes(params.startPath || '');
        const repoName: string = await RepositoryUtils.getRepoName(uiUtils, params.startPath);
        const startPath = params.startPath || path.resolve(process.cwd());
        if (!repoName) {
            if (!params.subRepo) {
                // check if the sub folders are git folders
                const gitFileList = await FileUtils.getFileList({
                    startPath: startPath,
                    maxLevels: 3,
                    filter: /\/\.git\/config$/
                });
                if (gitFileList.length > 0) {
                    for (let i = 0; i < gitFileList.length; i++) {
                        const subFolder = gitFileList[i].replace(/\/.git\/config$/, '');
                        try {
                            await RepositoryUtils.readRepository({
                                startPath: subFolder,
                                type: params.type,
                                subRepo: true
                            }, uiUtils);
                        } catch (error: any) {
                            uiUtils.info({origin: this.origin, message: error.toString() });
                        }
                    }
                } else {
                    throw 'Please run this command in a git folder.';
                }
            } else {
                throw 'Please run this command in a git folder.';
            }
        } else {

            if (!params.type) {
                if (repoName.match(/\-middle\-tier$/g)) {
                    params.type = 'serverless';
                } else if (repoName.match(/\-database$/g)) {
                    params.type = 'postgres';
                } else if (repoName.match(/\-frontend$/g)) {
                    params.type = 'frontend';
                } else {
                    throw 'No repository type provided. Please ensure you provide it through the "--type (-t)" option';
                }
            }
            if (params.type === 'serverless') {
                await ServerlessRepositoryReader.readRepo(startPath, repoName, uiUtils);
            } else if (params.type === 'postgres') {
                await DatabaseRepositoryReader.readRepo(startPath, repoName, uiUtils);
            } else if (params.type === 'frontend') {
                await FrontendRepositoryReader.readRepo(startPath, repoName, uiUtils);
            }
        }
    }

    static async checkDbParams(params: {filter: string, environment: string}, uiUtils: UiUtils) {
        await DatabaseRepositoryReader.checkParams(params, uiUtils);
    }

    static async listFunctions(filter: string, uiUtils: UiUtils) {
        await ServerlessRepositoryReader.listFunctions(filter, uiUtils);
    }
}
