#!/usr/bin/env node
import commandLineArgs, { CommandLineOptions } from 'command-line-args';
import { ServerUtils } from './utils/server.utils';
import { FileUtils } from './utils/file.utils';
import path from 'path';
import { RepositoryUtils } from './utils/repository.utils';
import { DatabaseInstaller } from './classes/database-installer';
import { DatabaseFileHelper } from './classes/databse-file-helper';
import { DatabaseRepositoryReader } from './classes/database-repo-reader';

const mainOptions = [
    { name: 'category', alias: 'z', type: String, defaultOption: true, description: 'Action' },
];

const options: CommandLineOptions = commandLineArgs(mainOptions, { stopAtFirstUnknown: true });
let argv = options._unknown || [];

const main = async () => {
    try {
        switch (options.category) {
            case 'db':
                const dbOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'environment', alias: 'e', type: String, description: 'environment' },
                    { name: 'application-name', alias: 'a', type: String, description: 'Application Name' },
                    { name: 'version', alias: 'v', type: String, description: 'Version to install' },
                    { name: 'filter', alias: 'f', type: String, description: 'regex filter to apply to the commands' },
                ]
                const dbOptions = commandLineArgs(dbOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                switch (dbOptions.action) {
                    case 'version':
                    case 'v':
                        await DatabaseRepositoryReader.updateVersionFile({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version
                        });
                        break;
                    case 'install':
                    case 'i':
                        await DatabaseInstaller.installDatabse({
                            applicationName: dbOptions['application-name'],
                            environment: dbOptions.environment,
                            version: dbOptions.version
                        });
                        break;
                    case 'params':
                    case 'p':
                        await RepositoryUtils.checkDbParams(
                            dbOptions.filter,
                            dbOptions.environment
                        );
                        break;
                    case 'gf':
                    case 'generate-functions':
                        await DatabaseFileHelper.createFunctions({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions['version'],
                            filter: dbOptions.filter,
                        });
                        break;
                    default:
                        break;
                }
                break;
            case 's':
            case 'serverless':
                const serverlessOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'all', alias: 'e', type: String, description: 'environment' },
                    { name: 'type', alias: 't', type: String, description: 'Type of the repository to read' },
                    { name: 'filter', alias: 'f', type: String, description: 'regex filter to apply to the commands' },
                ]
                const serverlessOptions = commandLineArgs(serverlessOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                
                switch (serverlessOptions.action) {
                    case 'l':
                    case 'list-functions':
                        await RepositoryUtils.listFunctions(serverlessOptions.filter);
                    default:
                        break;
                }
                break;
            case 'repo':
            case 'r':
                const repoOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'all', alias: 'e', type: String, description: 'environment' },
                    { name: 'type', alias: 't', type: String, description: 'Type of the repository to read' },
                ]
                const repoOptions = commandLineArgs(repoOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                switch (repoOptions.action) {
                    case 'read':
                    case 'r':
                        await RepositoryUtils.readRepository(path.resolve(process.cwd()), repoOptions.type);
                        break;
                    default:
                        break;
                }
                break;
            case 'c':
            case 'clear':
                await FileUtils.deleteFolderRecursiveSync(path.resolve(__dirname, '../../temp'));
                break;
            default:
                break;
        }
        switch (options.action) {
            case 'check-server':
                await ServerUtils.checkServer(true)
                break;
            case 'stop-server':
                await ServerUtils.stopServer();
                break;
            case 'start-server':
                await ServerUtils.startServer();
                break;
            default:
                break;
        }
    } catch (error) {
        console.log(error);
    }
}
main();