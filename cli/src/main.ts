#!/usr/bin/env node
import commandLineArgs, { CommandLineOptions } from 'command-line-args';
import { ServerUtils } from './utils/server.utils';
import { FileUtils } from './utils/file.utils';
import path from 'path';
import { RepositoryUtils } from './utils/repository.utils';

const optionDefinitions = [
    { name: 'action', alias: 'a', type: String, defaultOption: true, description: 'Action' },
    { name: 'help', alias: 'h', type: Boolean, description: 'Displays the help' },
    { name: 'type', alias: 't', type: String, description: 'Type of the repository to read' }
];
const options: CommandLineOptions = commandLineArgs(optionDefinitions);

// console.log(process.argv[0], process.cwd());

const main = async () => {
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
        case 'clear':
            await FileUtils.deleteFolderRecursiveSync(path.resolve(__dirname, '../../temp'));
            break;
        case 'read-repo':
            await RepositoryUtils.readRepository(path.resolve(process.cwd()), options.type);
            break;
        default:
            break;
    }
}
main();