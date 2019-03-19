import { LoggerUtils } from "../../utils/logger.utils";

export class FrontendRepositoryReader {
    private static _origin = 'FrontendRepositoryReader';

    static async readRepo(startPath: string, repoName: string, silent?: boolean) {
        // todo
        LoggerUtils.success({ origin: FrontendRepositoryReader._origin, message: `Repository read` });
    }

}