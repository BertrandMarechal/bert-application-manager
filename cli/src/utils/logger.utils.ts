import colors from 'colors';
import * as readline from "readline";

export type LoggerType = 'info' | 'warning' | 'error' | 'success';
export type LoggerColors = 'red' | 'grey' | 'green' | 'blue' | 'cyan' | 'white' | 'yellow' | 'grey';

let _originMaxLength = 0;
let _spaces = '';

interface LoggingParams {
    origin: string,
    message: string,
    type?: LoggerType,
    color?: LoggerColors,
    batchId?: number
}

export class LoggerUtils {
    static logTitle() {
        console.log(colors.red('\n' +
            '  ____        _        _                 _           \n' +
            ' |  _ \\  __ _| |_ __ _| | ___   __ _  __| | ___ _ __ \n' +
            ' | | | |/ _` | __/ _` | |/ _ \\ / _` |/ _` |/ _ \\ \'__|\n' +
            ' | |_| | (_| | || (_| | | (_) | (_| | (_| |  __/ |   \n' +
            ' |____/ \\__,_|\\__\\__,_|_|\\___/ \\__,_|\\__,_|\\___|_|   \n' +
            '                                                     \n'));
    }

    static log(params: LoggingParams) {
        if (params.origin.length > _originMaxLength) {
            _originMaxLength = params.origin.length,
            _spaces = ' '.repeat(_originMaxLength);
        }
        let typeColor: LoggerColors;
        switch(params.type) {
            case "error":
                typeColor = 'red';
                break;
            case "info":
                typeColor = 'cyan';
                break;
            case "warning":
                typeColor = 'yellow';
                break;
            case "success":
                typeColor = 'green';
                break;
            default:
                typeColor = 'grey';
        }
        const origin = `[${params.origin}${_spaces}`.slice(0, _originMaxLength + 1) + ']';
        // [MSSQL] - Batch 60:Mark batch as FINISHED
        console.log(
            new Date().toISOString().substr(0, 19) +
            ' - ' +
            colors.cyan(origin) +
            ' : ' +
            `${params.type ? colors[typeColor]('**' + params.type.toUpperCase() + '** ') : ''}` +
            colors[params.color || 'grey'](params.message) +
            (params.batchId ? colors.cyan(` (batch: ${params.batchId})`) : '')
        )
    }

    static info(params: LoggingParams) {
        LoggerUtils.log({...params,type: 'info'});
    }

    static error(params: LoggingParams) {
        LoggerUtils.log({...params,type: 'error'});
    }

    static warning(params: LoggingParams) {
        LoggerUtils.log({...params,type: 'warning'});
    }

    static success(params: LoggingParams) {
        LoggerUtils.log({...params,type: 'success'});
    }
    static question(params: {text: string, origin: string}): Promise<string> {
        const origin = `[${params.origin}${_spaces}`.slice(0, _originMaxLength + 1) + ']';
        const text = new Date().toISOString().substr(0, 19) +
            ' - ' +
            colors.cyan(origin) +
            ' : ' +
            params.text + '\n > ';
        return new Promise(resolve => {
            let rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(text, (answer) => {
                resolve(answer);
                rl.close();
            });
        });
    }
}