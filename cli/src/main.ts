#!/usr/bin/env node
import commandLineArgs, { CommandLineOptions } from 'command-line-args';
import { ServerUtils } from './utils/server.utils';
import { FileUtils } from './utils/file.utils';
import path from 'path';
import { RepositoryUtils } from './utils/repository.utils';
import { DatabaseInstaller } from './classes/database/database-installer';
import { DatabaseVersionChecker } from './classes/database/database-version-checker';
import { DatabaseTemplates } from './classes/database/database-templates';
import { DatabaseChecker } from './classes/database/database-checker';
import { DatabaseFileHelper } from './classes/database/database-file-helper';
import { DatabaseTagger } from './classes/database/database-tagger';
import { ServerlessFileHelper } from './classes/serverless/serverless-file-helper';
import { FrontendFileHelper } from './classes/frontend/frontend-file-helper';
import { DatabaseRepositoryReader } from './classes/database/database-repo-reader';
import { LoggerUtils } from './utils/logger.utils';
import { mainHelp, databaseHelp } from './utils/documentation.utils';
import { ServerlessRepositoryReader } from './classes/serverless/serverless-repo-reader';
import { CliFiles } from './classes/cli-files/cli-files';

const mainOptions = [
    { name: 'category', alias: 'z', type: String, defaultOption: true, description: 'Action' },
];

const options: CommandLineOptions = commandLineArgs(mainOptions, { stopAtFirstUnknown: true });
let argv = options._unknown || [];

const loggerUtils = new LoggerUtils();

const main = async () => {
    try {
        switch (options.category) {
            case 'db':
            case 'database':
                const dbOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'environment', alias: 'e', type: String, description: 'environment' },
                    { name: 'application-name', alias: 'a', type: String, description: 'Application Name' },
                    { name: 'object-name', alias: 'o', type: String, description: 'Object Name' },
                    { name: 'source-database', alias: 'd', type: String, description: 'Source database for replications' },
                    { name: 'object-type', alias: 'y', type: String, description: 'Object Type' },
                    { name: 'version', alias: 'v', type: String, description: 'Version to install' },
                    { name: 'template', alias: 't', type: String, description: 'Template' },
                    { name: 'tag', alias: '#', type: String, description: 'Tag' },
                    { name: 'remove', alias: 'r', type: Boolean, description: 'Remove tag' },
                    { name: 'value', alias: 'u', type: String, description: 'Value' },
                    { name: 'filter', alias: 'f', type: String, description: 'field / regex filter to apply to the commands' },
                ]
                const dbOptions = commandLineArgs(dbOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                switch (dbOptions.action) {
                    case 'version':
                    case 'v':
                        await DatabaseRepositoryReader.updateVersionFile({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version
                        }, loggerUtils);
                        break;
                    case 'replication-from':
                    case 'rf':
                        await DatabaseTemplates.setUpReplications({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version,
                            fromOrTo: 'from',
                            tableName: dbOptions['object-name']
                        }, loggerUtils);
                        break;
                    case 'replication-to':
                    case 'rt':
                        await DatabaseTemplates.setUpReplications({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version,
                            fromOrTo: 'to',
                            sourceDatabase: dbOptions['source-database'],
                            tableName: dbOptions['object-name']
                        }, loggerUtils);
                        break;
                    case 'install':
                    case 'i':
                        await DatabaseInstaller.installDatabase({
                            applicationName: dbOptions['application-name'],
                            environment: dbOptions.environment,
                            version: dbOptions.version
                        }, loggerUtils);
                        break;
                    case 'create-table':
                    case 'ct':
                        await DatabaseFileHelper.createTable({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version
                        }, loggerUtils);
                        break;
                    case 'new-version':
                    case 'nv':
                        await DatabaseFileHelper.createVersion({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions.version
                        }, loggerUtils);
                        break;
                    case 'init':
                    case 'n':
                        await DatabaseRepositoryReader.initDatabase({
                            applicationName: dbOptions['application-name']
                        }, loggerUtils);
                        break;
                    case 'check-version':
                    case 'cv':
                        await DatabaseVersionChecker.checkVersion({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions['version']
                        }, loggerUtils);
                        break;
                    case 'check-code':
                    case 'c':
                        await DatabaseChecker.checkCode({
                            applicationName: dbOptions['application-name']
                        }, loggerUtils);
                        break;
                    case 'params':
                    case 'p':
                        await RepositoryUtils.checkDbParams({
                            filter: dbOptions.filter,
                            environment: dbOptions.environment
                        }, loggerUtils);
                        break;
                    case 'gf':
                    case 'generate-functions':
                        await DatabaseFileHelper.createFunctions({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions['version'],
                            filter: dbOptions.filter,
                        }, loggerUtils);
                        break;
                    case 'e':
                    case 'edit-object':
                        await DatabaseFileHelper.editObject({
                            applicationName: dbOptions['application-name'],
                            objectName: dbOptions['object-name'],
                            objectType: dbOptions['object-type'],
                        }, loggerUtils);
                        break;
                    case 't':
                    case 'add-template':
                        await DatabaseTemplates.addTemplate({
                            applicationName: dbOptions['application-name'],
                            version: dbOptions['version'],
                            template: dbOptions.template,
                        }, loggerUtils);
                        break;
                    case '#':
                    case 'tag':
                        if (!dbOptions['filter']) {
                            if (!dbOptions['remove']) {
                                await DatabaseTagger.addTagOnTable({
                                    applicationName: dbOptions['application-name'],
                                    objectName: dbOptions['object-name'],
                                    tagName: dbOptions['tag'],
                                    tagValue: dbOptions['value']
                                }, loggerUtils);
                            } else {
                                await DatabaseTagger.removeTagFromTable({
                                    applicationName: dbOptions['application-name'],
                                    objectName: dbOptions['object-name'],
                                    tagName: dbOptions['tag']
                                }, loggerUtils);
                            }
                        } else {
                            if (!dbOptions['remove']) {
                                await DatabaseTagger.addTagOnField({
                                    applicationName: dbOptions['application-name'],
                                    objectName: dbOptions['object-name'],
                                    fieldName: dbOptions['filter'],
                                    tagName: dbOptions['tag'],
                                    tagValue: dbOptions['value']
                                }, loggerUtils);
                            } else {
                                await DatabaseTagger.removeTagFromField({
                                    applicationName: dbOptions['application-name'],
                                    objectName: dbOptions['object-name'],
                                    fieldName: dbOptions['filter'],
                                    tagName: dbOptions['tag']
                                }, loggerUtils);
                            }
                        }
                        break;
                    default:
                    case 'h':
                    case 'help':
                        console.log(databaseHelp);
                        break;
                }
                break;
            case 'm':
            case 'middle-tier':
                const serverlessOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'all', alias: 'e', type: String, description: 'environment' },
                    { name: 'type', alias: 't', type: String, description: 'Type of the repository to read' },
                    { name: 'application-name', alias: 'a', type: String, description: 'Application Name' },
                    { name: 'filter', alias: 'f', type: String, description: 'regex filter to apply to the commands' },
                    { name: 'database', alias: 'd', type: String, description: 'database name if DB name differs from the middle tier name' },
                ]
                const serverlessOptions = commandLineArgs(serverlessOptionsDefinitions, { argv, stopAtFirstUnknown: true });

                switch (serverlessOptions.action) {
                    case 'l':
                    case 'list-functions':
                        await RepositoryUtils.listFunctions(serverlessOptions.filter, loggerUtils);
                    case 'gf':
                    case 'generate-functions':
                        await ServerlessFileHelper.generateFunctions({
                            applicationName: serverlessOptions['application-name'],
                            filter: serverlessOptions.filter
                        }, loggerUtils);
                    case 'cro':
                    case 'ro':
                    case 'check-read-only':
                        await ServerlessRepositoryReader.checkPostgresCalls({
                            applicationName: serverlessOptions['application-name'],
                            databaseName: serverlessOptions['database'],
                            filter: serverlessOptions.filter
                        }, loggerUtils);
                    default:
                        break;
                }
                break;
            case 'frontend':
            case 'f':
                const frontendOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                    { name: 'all', alias: 'e', type: String, description: 'environment' },
                    { name: 'application-name', alias: 'a', type: String, description: 'Application Name' },
                    { name: 'filter', alias: 'f', type: String, description: 'regex filter to apply to the commands' },
                ]
                const frontendOptions = commandLineArgs(frontendOptionsDefinitions, { argv, stopAtFirstUnknown: true });

                switch (frontendOptions.action) {
                    case 'l':
                    case 'list-functions':
                        await RepositoryUtils.listFunctions(frontendOptions.filter, loggerUtils);
                    case 'g':
                    case 'generate-code':
                        await FrontendFileHelper.generateCode({
                            applicationName: frontendOptions['application-name'],
                            filter: frontendOptions.filter
                        }, loggerUtils);
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
                        await RepositoryUtils.readRepository({
                            type: repoOptions.type
                        }, loggerUtils);
                        break;
                    default:
                        break;
                }
                break;
            case 'c':
            case 'clear':
                await FileUtils.deleteFolderRecursiveSync(path.resolve(__dirname, '../../temp'));
                break;
            case 'files':
                await CliFiles.openFilesFolder();
                break;
            case 's':
            case 'server':
                const serverOptionsDefinitions = [
                    { name: 'action', defaultOption: true },
                ]
                const serverOptions = commandLineArgs(serverOptionsDefinitions, { argv, stopAtFirstUnknown: true });
                switch (serverOptions.action) {
                    case 'start':
                    case 's':
                        await ServerUtils.startServer();
                        process.exit();
                        break;
                    case 'stop':
                    case 'p':
                        await ServerUtils.stopServer();
                        break;
                    case 'check':
                    case 'c':
                        await ServerUtils.checkServer(true);
                        break;
                    default:
                        break;
                }
            default:
            case 'h':
            case 'help':
                console.log(mainHelp);
                break;
        }
    } catch (error) {
        console.log(error);
    }
}
main();
