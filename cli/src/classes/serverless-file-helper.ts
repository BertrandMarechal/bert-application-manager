import {DatabaseHelper} from './database-helper';
import { Bar, Presets } from "cli-progress";
import { DatabaseObject } from '../models/database-file.model';
import { LoggerUtils } from '../utils/logger.utils';
import { FileUtils } from '../utils/file.utils';
import path from 'path';
import colors from 'colors';
import yamljs from 'yamljs';
import {ServerlessRepositoryReader} from './serverless-repo-reader';
import { indentationSpaces } from './databse-file-helper';


export class ServerlessFileHelper {
    private static _origin = 'ServerlessRepositoryReader';
    static serverlessTemplatesFolder = path.resolve(process.argv[1], '../../data/serverless/templates');

    static async generateFunctions(params: {
        applicationName: string;
        filter: string;
    }) {
        if (!params.applicationName) {
            throw 'Please provide an application name';
        }
        if (!params.applicationName.match(/\-middle-tier$/)) {
            params.applicationName += '-middle-tier';
        }
        const applicationDatabaseName = params.applicationName.replace(/\-middle-tier$/, '-database');

        // read the db File, to get the list of functions
        const databaseObject: DatabaseObject = await DatabaseHelper.getApplicationDatabaseObject(applicationDatabaseName);
        if (!databaseObject) {
            throw 'This application does not exist';
        }
        // from those functions, create a service


        
        const actions = [
            'save',
            'get',
            'list',
            'delete',
        ];
        let filesCreated = 0;
        let filesIgnored = 0;
        let filesOverwritten = 0;
        
        const tables = Object.keys(databaseObject.table);
        const bar = new Bar({
            format: `Functions  [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
            clearOnComplete: true
        }, Presets.shades_grey);

        bar.start(tables.length * 4, 0);

        const functionsToAdd: {
            functionName: string;
            dbFunctionName: string;
            functionFields: string[];
            functionPath: string;
            servicePath: string;
            serviceName: string;
            operation: string;
            readOnly: boolean;
        }[] = [];
        for (let t = 0; t < tables.length; t++) {
            const tableName = tables[t];
            if (!databaseObject.table[tableName].tags.ignore) {
                const slsParams: {[name: string]: string} = {
                    function_name: '',
                    read_only: '',
                    db_function_name: '',
                    db_camel_cased_parameters: '',
                    function_description: ''
                };
                const nameWithoutPrefixAndSuffix = tableName
                    .replace(new RegExp(`\_${databaseObject.table[tableName].tableSuffix}$`), '')
                    .replace(new RegExp(`^${databaseObject._properties.dbName}t\_`), '');
                const nameWithoutUnderscore = nameWithoutPrefixAndSuffix.replace(/_/g, '');
                const serviceName: string = databaseObject.table[tableName].tags['service-name'] ? 
                    databaseObject.table[tableName].tags['service-name'].value : 'service';
                const folderPath = path.resolve(databaseObject._properties.path.replace('database', 'middle-tier'), 'lambda', serviceName);
    
                FileUtils.createFolderStructureIfNeeded(folderPath);
                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    slsParams.function_name = action + nameWithoutUnderscore;
                    slsParams.db_function_name = `${databaseObject._properties.dbName}f_${action}_${nameWithoutPrefixAndSuffix}`;
                    slsParams.read_only = action === 'get' || action === 'list' ? 'ReadOnly' : '';
                    slsParams.function_description = `${action} ${nameWithoutPrefixAndSuffix.replace(/_/g, ' ')}`;
                    let params: string[] = [];
                    switch (action) {
                        case 'get':
                            params = ['id'];
                            break;
                        case 'delete':
                            params = ['id', 'modifiedAt'];
                            break;
                        case 'save':
                        case 'list':
                            params = ['params'];
                            break;
                        default:
                            break;
                    }
                    slsParams.db_camel_cased_parameters = params.map(x => `'${x}'`).join(', ');
                    const fileName = path.resolve(folderPath, 'handlers', nameWithoutPrefixAndSuffix.replace(/_/g, '-'), `${slsParams.function_name}.js`);

                    if (!databaseObject.table[tableName].tags[`no-${action}`]) {
                        // let fileString = await FileUtils.readFile(path.resolve(process.argv[1], ServerlessFileHelper.serverlessTemplatesFolder, 'handlers', `lambda.js`));
        
                        // for (let j = 0; j < slsParamsFields.length; j++) {
                        //     const param = slsParamsFields[j];
                        //     fileString = fileString.replace(new RegExp(`<${param}>`, 'gi'), slsParams[param]);
                        // }

                        let writeFile = true;
    
                        // if (FileUtils.checkIfFolderExists(fileName)) {
                        //     // we have an existing file. We get the content, and check if it is different. If yer, we override
                        //     const currentFileCOntent = await FileUtils.readFile(fileName);
                        //     if (currentFileCOntent !== fileString) {
                        //         writeFile = true;
                        //         filesOverwritten++;
                        //     } else {
                        //         writeFile = false;
                        //         filesIgnored++;
                        //     }
                        // } else {
                        //     writeFile = true;
                        // }
                        if (writeFile) {
                            // FileUtils.writeFileSync(fileName, fileString);
                            filesCreated++;
                            
                            functionsToAdd.push({
                                functionName: slsParams.function_name,
                                dbFunctionName: slsParams.db_function_name,
                                functionPath: `handlers/${nameWithoutPrefixAndSuffix.replace(/_/g, '-')}/${slsParams.function_name}`,
                                servicePath: folderPath,
                                serviceName: serviceName,
                                functionFields: params,
                                readOnly: slsParams.read_only === 'ReadOnly',
                                operation: slsParams.function_description
                            });
                        }
                        bar.update(4 * t + i);
                    }
                }
            }
        }
        bar.stop();
        let feedback = 'No files created.';

        if (filesCreated) {
            feedback = `Created ${filesCreated} files.`
        }
        if (filesIgnored) {
            feedback += ` ${colors.yellow(`${filesIgnored}`)} files ignored (as unchanged)`;
        }
        if (filesOverwritten) {
            feedback += ` ${colors.yellow(`${filesOverwritten}`)} files overwritten`;
        }

        if (filesCreated) {
            LoggerUtils.success({origin: this._origin, message: feedback});
        } else {
            LoggerUtils.warning({origin: this._origin, message: feedback});
        }

        const takenNames: {
            abrevations: {
                [serviceName: string]: string
            };
            serviceNames: {
                [abbreviations: string]: string;
            };
        } = {
            abrevations: {},
            serviceNames: {},
        };
        // todo fill the taken names with the current service data

        if (filesCreated || filesOverwritten) {
            const services = functionsToAdd.reduce((agg: string[], curr) => {
                if (agg.indexOf(curr.serviceName) === -1) {
                    agg.push(curr.serviceName);
                }
                return agg;
            }, []);            
            for (let i = 0; i < services.length; i++) {
                const service = services[i];
                
                let abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, 1);
                // get the service name
                if (takenNames.serviceNames[service]) {
                    // service already exist, we get the same name
                    abbreviation = takenNames.serviceNames[service];
                } else if (takenNames.abrevations[abbreviation]) {
                    let letterCount = 2;
                    abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, letterCount);
                    while (takenNames.abrevations[abbreviation] && letterCount < service.length) {
                        letterCount++;
                        abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, letterCount);
                    }

                    if (abbreviation === service) {
                        let index = 0;
                        abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, 1) + `${index + 1}`;
                        while (takenNames.abrevations[abbreviation]) {
                            index++;
                            abbreviation = databaseObject._properties.dbName + '-' + service.substr(0, 1) + `${index + 1}`;
                        }
                    }
                    takenNames.abrevations[abbreviation] = service;
                    takenNames.serviceNames[service] = abbreviation;
                }
                // copy the files in the folder if nothing exists
                const folderPath = path.resolve(databaseObject._properties.path.replace('database', 'middle-tier'), 'lambda', service);

                FileUtils.createFolderStructureIfNeeded(path.resolve(folderPath, 'utils'));
                FileUtils.createFolderStructureIfNeeded(path.resolve(folderPath, 'handlers'));

                const existingService = FileUtils.checkIfFolderExists(path.resolve(folderPath, 'serverless.yml'));
                const filesToCreate = [
                    {
                        from: path.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'serverless.yml'),
                        to: path.resolve(folderPath, 'serverless.yml')
                    },
                    {
                        from: path.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'variables.yml'),
                        to: path.resolve(folderPath, 'variables.yml')
                    },
                    {
                        from: path.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'handlers', 'runfunction.js'),
                        to: path.resolve(folderPath, 'handlers', 'runfunction.js')
                    },
                    {
                        from: path.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'handlers', 'functions.js'),
                        to: path.resolve(folderPath, 'handlers', 'functions.js')
                    },
                    {
                        from: path.resolve(ServerlessFileHelper.serverlessTemplatesFolder, 'utils', 'CommonUtils.js'),
                        to: path.resolve(folderPath, 'utils', 'CommonUtils.js')
                    },
                ];
                for (let j = 0; j < filesToCreate.length; j++) {
                    const fileToCreate = filesToCreate[j];
                    if (!FileUtils.checkIfFolderExists(fileToCreate.to)) {
                        FileUtils.copyFileSync(
                            fileToCreate.from,
                            fileToCreate.to
                        );
                    }
                    
                }
                if (existingService) {
                    // update the current service
                    let fileString = await FileUtils.readFile(path.resolve(folderPath, 'serverless.yml'));
                    const serverlessYmlAsJson = ServerlessFileHelper.ymlToJson(fileString);
                    if (!serverlessYmlAsJson.functions.runfunction) {
                        serverlessYmlAsJson.functions.runfunction = {
                            handler: 'handlers/runfunction.runfunction'
                        };
                    }

                    FileUtils.writeFileSync(
                        path.resolve(folderPath, 'serverless.yml'),
                        yamljs.stringify(serverlessYmlAsJson, 15, 2)
                    );
                } else {
                    
                    // update the functions file
                    const functions = `module.exports.functions = {\n${
                        functionsToAdd
                        .filter(x => x.serviceName === service)
                        .map(x => `${indentationSpaces}${x.functionName}: {dbName: '${x.dbFunctionName}', fields: [${
                            x.functionFields.map(y => `'${y}'`).join(', ')
                        }], operationName: '${x.operation}', readOnly: ${x.readOnly ? 'true' : 'false'}}`)
                        .join(',\n')
                    }\n};`;
                    FileUtils.writeFileSync(
                        path.resolve(folderPath, 'handlers', 'functions.js'),
                        functions
                    );

                    let fileString = await FileUtils.readFile(path.resolve(folderPath, 'serverless.yml'));
                    const serverlessYmlAsJson = ServerlessFileHelper.ymlToJson(fileString);

                    serverlessYmlAsJson.service = abbreviation;
                    if (!serverlessYmlAsJson.functions.runfunction) {
                        serverlessYmlAsJson.functions.runfunction = {
                            handler: 'handlers/runfunction.runfunction'
                        };
                    }

                    FileUtils.writeFileSync(
                        path.resolve(folderPath, 'serverless.yml'),
                        yamljs.stringify(serverlessYmlAsJson, 15, 2)
                    );
                }
            }
            
            await ServerlessRepositoryReader.readRepo(
                databaseObject._properties.path.replace('database', 'middle-tier'),
                params.applicationName
            );
        }
        return await Promise.resolve(true);
    }
    
    private static ymlToJson(yml: string) {
        return yamljs.parse(yml.replace(/\t/g, '  ').replace(/\r\n\r\n/g, '\r\n').replace(/\r\n\r\n/g, '\r\n').replace(/\n$/, "").trim());
    }
}