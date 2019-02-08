import { FileUtils } from "./file.utils";
import path from "path";
import { ServerlessRepositoryReader } from "../classes/serverless-repo-reader";

export type RepositoryType = 'postgres' | 'serverless';

export class RepositoryUtils {

    private static processFileName(fileName: string) {
        return fileName.replace(/[\/\/]|[\\\\]/g, '/');
    }
    static async readRepository (startPath: string, type: RepositoryType) {
        if (!type) {
            throw 'No repository type provided. Please ensure you provide it through the "--type (-t)" option';
        }

        ServerlessRepositoryReader.readRepo(startPath)

        // const files = await FileUtils.getFileList({
        //     startPath: startPath,
        //     filter: (type ==='postgres' ? /.sql/ : /serverless.yml/)
        // });

        // const newPath = RepositoryUtils.processFileName(startPath);
        // const result: any = {
        //     path: newPath,
        //     fileList: files
        //         .map((x: string) => RepositoryUtils.processFileName(x).replace(newPath, ''))
        // };
        // for (let i = 0; i < files.length; i++) {
        //     const element = files[i];
        //     const file = await FileUtils.readFile(path.resolve(startPath, element));

        //     const createTableRegex = /create\W+(or\W+replace\W+)?table\W+([a-z0-9_]+)\W/i;
        //     const firstParametersRegex = /\(.*?\)/
        // }

        // console.log(JSON.stringify(result, null, 2));
    }

    static async listFunctions(filter: string) {
        await ServerlessRepositoryReader.listFunctions(filter);
    }
}