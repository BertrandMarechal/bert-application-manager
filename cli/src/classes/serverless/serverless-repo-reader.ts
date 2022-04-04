import { FileUtils } from "../../utils/file.utils";
import * as YAML from 'yamljs';
import { ServerlessFile } from "../../models/serverless-file.model";
import path from 'path';
import colors from 'colors';
import { UiUtils } from "../../utils/ui.utils";
import { RepositoryUtils } from "../../utils/repository.utils";
import { DatabaseObject } from "../../models/database-file.model";
import { DatabaseHelper } from "../database/database-helper";
import { ServerlessFileHelper } from "./serverless-file-helper";

export class ServerlessRepositoryReader {
    private static _origin = 'ServerlessRepositoryReader';
    private static _tempFolderPath = path.resolve(process.argv[1], '../../../temp');
    private static _serverlessDbPath = ServerlessRepositoryReader._tempFolderPath + '/serverless-db.json';

    static async readRepo(startPath: string, repoName: string, uiUtils: UiUtils) {
        const files = await FileUtils.getFileList({
            startPath: startPath,
            filter: /serverless.yml/
        });
        const variableFiles = await FileUtils.getFileList({
            startPath: startPath,
            filter: /variables.yml/
        });
        const serverlessFiles = await ServerlessRepositoryReader._readFiles(files, variableFiles, uiUtils);

        // read the current serverless file and add on
        FileUtils.createFolderStructureIfNeeded(ServerlessRepositoryReader._tempFolderPath);
        let fileData: { [name: string]: ServerlessFile[] } = {};
        if (FileUtils.checkIfFolderExists(ServerlessRepositoryReader._serverlessDbPath)) {
            fileData = await FileUtils.readJsonFile(ServerlessRepositoryReader._serverlessDbPath);
        }
        fileData[repoName] = serverlessFiles;
        FileUtils.writeFileSync(ServerlessRepositoryReader._serverlessDbPath, JSON.stringify(fileData, null, 2));
        uiUtils.success({ origin: this._origin, message: `Repository read` });
    }

    private static _ymlToJson(data: string) {
        return YAML.parse(data.replace(/\t/g, '  ').replace(/\r\n\r\n/g, '\r\n').replace(/\r\n\r\n/g, '\r\n').replace(/\n$/, "").trim());
    }

    private static async _readFiles(files: string[], variableFiles: string[], uiUtils: UiUtils): Promise<ServerlessFile[]> {
        const serverlessFiles: ServerlessFile[] = [];

        uiUtils.startProgress({ length: files.length, start: 0, title: 'serverless.yml' });
        for (let i = 0; i < files.length; i++) {
            uiUtils.progress(i + 1);
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
        uiUtils.stoprProgress();
        return serverlessFiles;
    }

    static async listFunctions(filter: string, uiUtils: UiUtils): Promise<void> {
        filter = filter || '';

        let regex: RegExp = new RegExp(filter);
        const fileData: { [name: string]: ServerlessFile[] } = await FileUtils.readJsonFile(ServerlessRepositoryReader._serverlessDbPath);

        if (!fileData) {
            uiUtils.warning({ origin: ServerlessRepositoryReader._origin, message: 'No functions found' });
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

    static async checkPostgresCalls(params: {
        applicationName: string;
        databaseName?: string;
        filter: string;
    }, uiUtils: UiUtils) {
        await RepositoryUtils.checkOrGetApplicationName(params, 'middle-tier', uiUtils);
        const applicationDatabaseName = params.databaseName || params.applicationName.replace(/\-middle-tier$/, '-database');
        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(applicationDatabaseName);
        if (!databaseObject) {
            throw `No database could be found with those parameters, please use the --database (-d) parameter`;
        }

        const allServerlessFiles: { [appName: string]: ServerlessFile[] } = await FileUtils.readJsonFile(ServerlessRepositoryReader._serverlessDbPath);
        const serverlessFiles = allServerlessFiles[params.applicationName];
        if (!serverlessFiles) {
            throw 'This application does not exist';
        }
        const functionsAndMode: { [functionName: string]: string } = Object.keys(databaseObject.function)
            .reduce((agg, curr) => ({ ...agg, [curr]: databaseObject.function[curr].mode }), {});
        const functionsWithIssues: {
            lambdaFunctionName: string;
            postgresFunctionName: string;
            error: string;
            fileName: string;
            serverlessFileName?: string;
            errorType: 'missing-file' | 'missing-function' | 'put-to-read-only' | 'put-to-process';
            severity: 'error' | 'warning';
        }[] = [];
        const fileCount = serverlessFiles.reduce((agg, curr) => agg + Object.keys(curr.functions).length, 0);
        uiUtils.startProgress({ length: fileCount, start: 0, title: 'analyzing functions' });
        let k = 1;
        for (let i = 0; i < serverlessFiles.length; i++) {
            const serverlessFile = serverlessFiles[i];
            for (let j = 0; j < serverlessFile.functions.length; j++) {
                uiUtils.progress(k + 1);
                k++;
                const serverlessFunction = serverlessFile.functions[j];
                let serverlessFunctionString = '';
                const fileName = path.resolve(
                    serverlessFile.fileName.replace(/serverless\.yml$/, ''),
                    `${serverlessFunction.handler}.js`
                );
                try {
                    serverlessFunctionString = await FileUtils.readFile(fileName);
                } catch (error) {
                    functionsWithIssues.push({
                        lambdaFunctionName: serverlessFunction.handlerFunctionName,
                        severity: "error",
                        postgresFunctionName: '',
                        fileName: serverlessFile.fileName,
                        errorType: 'missing-file',
                        serverlessFileName: serverlessFile.fileName,
                        error: `File "${
                            path.resolve(serverlessFile.fileName.replace(/serverless\.yml$/, ''), `${serverlessFunction.handler}.js`)
                            }" does not exist`
                    });
                }
                if (serverlessFunctionString) {
                    const processRegex = /CommonUtils\.(process|processReadOnly)\([^']+(?:\'|")([a-z0-9]+\_[a-z0-9]+\_[a-z0-9]+)(?:\'|")/gi;
                    let extracted = processRegex.exec(serverlessFunctionString);
                    while (extracted) {
                        const [, typeOfProcess, functionName] = extracted;
                        if (!functionsAndMode[functionName]) {
                            functionsWithIssues.push({
                                lambdaFunctionName: serverlessFunction.handlerFunctionName,
                                severity: "error",
                                postgresFunctionName: functionName,
                                fileName,
                                errorType: 'missing-function',
                                error: `Missing postgres function "${functionName}"`
                            });
                        }
                        if (typeOfProcess === 'process') {
                            if (functionsAndMode[functionName] !== 'volatile') {
                                // can be put on read only
                                functionsWithIssues.push({
                                    lambdaFunctionName: serverlessFunction.handlerFunctionName,
                                    severity: 'warning',
                                    postgresFunctionName: functionName,
                                    fileName,
                                    errorType: 'put-to-read-only',
                                    error: `"${functionName}" can be put on read only mode`
                                });
                            }
                        } else if (typeOfProcess === 'processReadOnly') {
                            if (functionsAndMode[functionName] === 'volatile') {
                                // can be put on read only
                                functionsWithIssues.push({
                                    lambdaFunctionName: serverlessFunction.handlerFunctionName,
                                    severity: 'error',
                                    postgresFunctionName: functionName,
                                    fileName,
                                    errorType: 'put-to-process',
                                    error: `Please call "${functionName}" with the "process" operator`
                                });
                            }
                        }
                        extracted = processRegex.exec(serverlessFunctionString);
                    }
                }
            }
        }
        uiUtils.stoprProgress();
        for (let i = 0; i < functionsWithIssues.length; i++) {
            const f = functionsWithIssues[i];
            uiUtils[f.severity]({
                message: `${f.lambdaFunctionName} - ${f.error}`,
                origin: ServerlessRepositoryReader._origin
            });
        }
        const issuesWeCanFix = functionsWithIssues.filter(x => x.errorType !== 'missing-function');
        if (issuesWeCanFix.length) {
            const fix = await uiUtils.question({
                origin: ServerlessRepositoryReader._origin,
                text: `Do you want to resolve the issues above ? (y/n)`
            });
            if (fix.toLowerCase() === 'y') {
                uiUtils.info({
                    origin: ServerlessRepositoryReader._origin,
                    message: 'Solving...'
                });

                for (let i = 0; i < issuesWeCanFix.length; i++) {
                    const issue = issuesWeCanFix[i];
                    if (issue.errorType === 'put-to-process') {
                        uiUtils.info({
                            origin: ServerlessRepositoryReader._origin,
                            message: `  - Putting ${issue.lambdaFunctionName} to process on calling ${issue.postgresFunctionName}`
                        });
                        let fileString = await FileUtils.readFile(issue.fileName);
                        const regex = new RegExp(`\.processReadOnly\\(([^']+)(\'|")(${issue.postgresFunctionName})(\'|")`, 'gi');
                        fileString = fileString.replace(regex, `.process($1$2$3$4`);
                        await FileUtils.writeFileSync(issue.fileName, fileString);
                    } else if (issue.errorType === 'put-to-read-only') {
                        uiUtils.info({
                            origin: ServerlessRepositoryReader._origin,
                            message: `  - Putting ${issue.lambdaFunctionName} to processReadOnly on calling ${issue.postgresFunctionName}`
                        });
                        let fileString = await FileUtils.readFile(issue.fileName);
                        const regex = new RegExp(`\.process\\(([^']+)(\'|")(${issue.postgresFunctionName})(\'|")`, 'gi');
                        fileString = fileString.replace(regex, `.processReadOnly($1$2$3$4`);
                        await FileUtils.writeFileSync(issue.fileName, fileString);
                    } else if (issue.errorType === 'missing-file') {
                        let serverlessFile = ServerlessFileHelper.ymlToJson(await FileUtils.readFile(issue.fileName));
                        delete serverlessFile.functions[issue.lambdaFunctionName];
                        if (Object.keys(serverlessFile.functions).length) {
                            uiUtils.info({
                                origin: ServerlessRepositoryReader._origin,
                                message: `  - Removing ${issue.lambdaFunctionName} from serverless.yml`
                            });
                            const newFileData = ServerlessFileHelper.jsonToYml(serverlessFile);
                            await FileUtils.writeFileSync(issue.fileName, newFileData);
                        } else {
                            uiUtils.warning({
                                origin: ServerlessRepositoryReader._origin,
                                message: `Removing ${issue.lambdaFunctionName} will make this service useless. Please delete manually`
                            });
                            const deleteFolder = await uiUtils.choices({
                                choices: [
                                    'No',
                                    'Yes',
                                ],
                                title: 'Delete folder',
                                message: 'Do you want to delete this folder'
                            });
                            if (deleteFolder['Delete folder'] === 'Yes') {
                                uiUtils.info({
                                    origin: ServerlessRepositoryReader._origin,
                                    message: `  - Removing ${issue.lambdaFunctionName} from serverless.yml`
                                });
                                if (issue.serverlessFileName) {
                                    FileUtils.deleteFolderRecursiveSync(issue.serverlessFileName.replace(/(\\|\/)serverless.yml$/, ''))
                                }
                            }
                        }
                    }
                }

                uiUtils.success({
                    origin: ServerlessRepositoryReader._origin,
                    message: 'Solved...'
                });
            }
        }
    }

    private static formatServerlessFile(fileString: string): string {
        return fileString
            .replace(/\r/g, '')
            .replace(/\n/g, '')
            .replace(/\t/g, ' ')
            .replace(/  /g, ' ')
            .replace(/  /g, ' ');
    }
}
