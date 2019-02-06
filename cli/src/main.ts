#!/usr/bin/env node
import commandLineArgs, { CommandLineOptions } from 'command-line-args';
import { ServerUtils } from './utils/server.utils';

const optionDefinitions = [
    { name: 'action', alias: 'a', type: String, defaultOption: true, description: 'Action' },
    { name: 'help', alias: 'h', type: Boolean, description: 'Displays the help' }
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
        default:
            break;
    }
}
main();