import colors from 'colors';
import * as readline from "readline";

import {UiUtils, LoggingParams, LoggerColors} from './ui.utils';

let _originMaxLength = 0;
let _spaces = '';

export class LoggerUtils extends UiUtils {
    static logTitle() {
        console.log(colors.red('### - Application Manager - ###'));
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

    log(params: LoggingParams) {
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

    info(params: LoggingParams) {
        LoggerUtils.log({...params,type: 'info'});
    }

    error(params: LoggingParams) {
        LoggerUtils.log({...params,type: 'error'});
    }

    warning(params: LoggingParams) {
        LoggerUtils.log({...params,type: 'warning'});
    }

    success(params: LoggingParams) {
        LoggerUtils.log({...params,type: 'success'});
    }
    question(params: {text: string, origin: string}): Promise<string> {
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