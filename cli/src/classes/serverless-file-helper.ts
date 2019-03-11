import {DatabaseHelper} from './database-helper';
import { Bar, Presets } from "cli-progress";
import { DatabaseObject } from '../models/database-file.model';
import { LoggerUtils } from '../utils/logger.utils';
import { FileUtils } from '../utils/file.utils';
import path from 'path';
import colors from 'colors';
import yamljs from 'yamljs';
import {ServerlessRepositoryReader} from './serverless-repo-reader';


export class ServerlessFileHelper {
    private static _origin = 'ServerlessRepositoryReader';
    static serverlessTemplatesFolder = '../../data/serverless/templates';

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
            functionPath: string;
            servicePath: string;
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
                const slsParamsFields = Object.keys(slsParams);
                const nameWithoutPrefixAndSuffix = tableName
                    .replace(new RegExp(`\_${databaseObject.table[tableName].tableSuffix}$`), '')
                    .replace(new RegExp(`^${databaseObject._properties.dbName}t\_`), '');
                const nameWithoutUnderscore = nameWithoutPrefixAndSuffix.replace(/_/g, '');
    
                const folderPath = path.resolve(databaseObject._properties.path.replace('database', 'middle-tier'), 'lambda', 'service');
    
                FileUtils.createFolderStructureIfNeeded(folderPath);
                for (let i = 0; i < actions.length; i++) {
                    const action = actions[i];
                    slsParams.function_name = action + nameWithoutUnderscore;
                    slsParams.db_function_name = `${slsParams.db_prefix}f_${action}_${nameWithoutPrefixAndSuffix}`;
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
                        let fileString = await FileUtils.readFile(path.resolve(process.argv[1], ServerlessFileHelper.serverlessTemplatesFolder, 'handlers', `lambda.js`));
        
                        for (let j = 0; j < slsParamsFields.length; j++) {
                            const param = slsParamsFields[j];
                            fileString = fileString.replace(new RegExp(`<${param}>`, 'gi'), slsParams[param]);
                        }

                        let writeFile = true;
    
                        if (FileUtils.checkIfFolderExists(fileName)) {
                            // we have an existing file. We get the content, and check if it is different. If yer, we override
                            const currentFileCOntent = await FileUtils.readFile(fileName);
                            if (currentFileCOntent !== fileString) {
                                writeFile = true;
                                filesOverwritten++;
                            } else {
                                writeFile = false;
                                filesIgnored++;
                            }
                        } else {
                            writeFile = true;
                        }
                        if (writeFile) {
                            FileUtils.writeFileSync(fileName, fileString);
                            filesCreated++;
                            
                            functionsToAdd.push({
                                functionName: slsParams.function_name,
                                functionPath: `handlers/${nameWithoutPrefixAndSuffix.replace(/_/g, '-')}/${slsParams.function_name}`,
                                servicePath: folderPath
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

        if (filesCreated || filesOverwritten) {
            // in this service, create functions
            let fileString = await FileUtils.readFile(path.resolve(process.argv[1], ServerlessFileHelper.serverlessTemplatesFolder, `serverless.yml`));
            const serverlessYmlAsJson = ServerlessFileHelper.ymlToJson(fileString);
            serverlessYmlAsJson.service = databaseObject._properties.dbName + '-a';
            serverlessYmlAsJson.functions = functionsToAdd.reduce((agg, curr) => {
                return {
                    ...agg,
                    [curr.functionName]: {
                        handler: curr.functionPath
                    }
                };
            }, {});

            // we jsut consider one service for now
            FileUtils.createFolderStructureIfNeeded(functionsToAdd[0].servicePath);
            FileUtils.writeFileSync(
                path.resolve(
                    functionsToAdd[0].servicePath,
                    'serverless.yml'
                ),
                yamljs.stringify(serverlessYmlAsJson, 15, 2)
            );
            
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