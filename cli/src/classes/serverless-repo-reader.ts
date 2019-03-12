import { FileUtils } from "../utils/file.utils";
import * as YAML from 'yamljs';
import { LoggerUtils } from "../utils/logger.utils";
import { ServerlessFile } from "../models/serverless-file.model";
import path from 'path';
import colors from 'colors';
import { Bar, Presets } from 'cli-progress';

export class ServerlessRepositoryReader {
    private static _origin = 'ServerlessRepositoryReader';
    private static _tempFolderPath = path.resolve(process.argv[1], '../../../temp');
    private static _serverlessDbPath = ServerlessRepositoryReader._tempFolderPath + '/serverless-db.json';

    static async readRepo(startPath: string, repoName: string) {
        const files = await FileUtils.getFileList({
            startPath: startPath,
            filter: /serverless.yml/
        });
        // LoggerUtils.info({ origin: ServerlessRepositoryReader._origin, message: `${files.length} files found` });
        const variableFiles = await FileUtils.getFileList({
            startPath: startPath,
            filter: /variables.yml/
        });
        const serverlessFiles = await ServerlessRepositoryReader._readFiles(files, variableFiles);

        // read the current db file and add on
        FileUtils.createFolderStructureIfNeeded(ServerlessRepositoryReader._tempFolderPath);
        let fileData: { [name: string]: ServerlessFile[] } = {};
        if (FileUtils.checkIfFolderExists(ServerlessRepositoryReader._serverlessDbPath)) {
            fileData = await FileUtils.readJsonFile(ServerlessRepositoryReader._serverlessDbPath);
        }
        fileData[repoName] = serverlessFiles;
        // LoggerUtils.info({ origin: ServerlessRepositoryReader._origin, message: `Saving data in serverless db file` });
        FileUtils.writeFileSync(ServerlessRepositoryReader._serverlessDbPath, JSON.stringify(fileData, null, 2));
        LoggerUtils.success({ origin: this._origin, message: `Repository read` });
    }

    private static _ymlToJson(data: string) {
        return YAML.parse(data.replace(/\t/g, '  ').replace(/\r\n\r\n/g, '\r\n').replace(/\r\n\r\n/g, '\r\n').replace(/\n$/, "").trim());
    }

    private static async _readFiles(files: string[], variableFiles: string[]): Promise<ServerlessFile[]> {
        const serverlessFiles: ServerlessFile[] = [];

        let bar = new Bar({
            format: `serverless.yml [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
            clearOnComplete: true
        }, Presets.shades_grey);
        bar.start(files.length, 1);
        for (let i = 0; i < files.length; i++) {
            bar.update(i + 1);
            const fileString = FileUtils.readFileSync(files[i]);

            const serverlessFile: ServerlessFile = new ServerlessFile(ServerlessRepositoryReader._ymlToJson(fileString));
            serverlessFile.fileName = files[i];

            const variableFileName = variableFiles.find(x => x.replace(/variables\.yml$/, 'serverless.yml') === files[i]);
            let variables: { [name: string]: string } = {};
            if (variableFileName) {
                const variableFileString = FileUtils.readFileSync(variableFileName);
                variables = ServerlessRepositoryReader._ymlToJson(variableFileString);
            }

            let serverlessVariables: { key: string, value: string | null, declared: boolean, variableFileName: string }[] = [];
            const regexVariables = new RegExp(/\$\{file\(\.\/variables\.yml\)\:(.*?)\}/gi);
            // get the serverless variables
            serverlessVariables = serverlessFile.environmentVariables.map(x => {
                let newValue = x.value;
                let match = regexVariables.exec(newValue);
                const subVars = [];
                while (match != null) {
                    subVars.push(match[1]);
                    newValue = newValue.replace(regexVariables, match[1])
                    match = regexVariables.exec(newValue);
                }
                return {
                    ...x,
                    value: variables[newValue],
                    variableFileName: newValue,
                    declared: !!variables[newValue],
                }
            });

            serverlessVariables.forEach(variable => {
                const varIndex = serverlessFile.environmentVariables.findIndex(x => x.key === variable.key);
                if (varIndex > -1) {
                    serverlessFile.environmentVariables[varIndex].declared = true;
                    serverlessFile.environmentVariables[varIndex].value = variable.value as string;
                }
            });
            serverlessFiles.push(serverlessFile);
        }
        bar.stop();
        return serverlessFiles;
    }

    static async listFunctions(filter: string): Promise<void> {
        filter = filter || '';
        
        let regex: RegExp = new RegExp(filter);
        const fileData: { [name: string]: ServerlessFile[] } = await FileUtils.readJsonFile(ServerlessRepositoryReader._serverlessDbPath);
        
        if (!fileData) {
            LoggerUtils.warning({ origin: ServerlessRepositoryReader._origin, message: 'No functions found' });
        } else {

            const functions: string[] = Object.keys(fileData)
                .map((repo) => {
                    let functionsAndServices = fileData[repo].map((serverlessFile: ServerlessFile) => {
                        return serverlessFile.functions.map(f => {
                            return `\t${colors.green(serverlessFile.serviceName)}-${colors.cyan(f.name)}`;
                        });
                    }).reduce((agg, curr) => agg.concat(curr), []);
                    if (!regex.test(repo)) {
                        functionsAndServices = functionsAndServices.filter(str => regex.test(str));
                    }
                    if (functionsAndServices.length > 0) {
                        functionsAndServices.unshift(colors.yellow(repo));
                        functionsAndServices.unshift('');
                    }
                    return functionsAndServices;
                }).reduce((agg, curr) => agg.concat(curr), []).filter(Boolean);
            console.log(functions.join('\n'));
        }
    }
}