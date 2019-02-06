import { FileUtils } from "./file.utils";

export type RepositoryType = 'postgres' | 'serverless';

export class RepositoryUtils {
    static async readRepository (path: string, type: RepositoryType) {
        const files = await FileUtils.getFileList({
            startPath: path,
            filter: (type ==='postgres' ? /.sql/ : /serverless.yml/)
        });
        console.log(files);
    }
}