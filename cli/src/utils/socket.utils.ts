import { LoggingParams, UiUtils } from './ui.utils';
import IO from "socket.io";

export class SocketUtils implements UiUtils {
    client?: IO.Socket;
    constructor(client?: IO.Socket) {
        this.client = client;
    }

    emit(message: string, params: any) {
        if (this.client) {
            this.client.emit(message, params);
        }
    }

    log(params: LoggingParams) {
        (this.client as IO.Socket).emit('log', params);
    }
    info(params: LoggingParams) {
        (this.client as IO.Socket).emit('info', params);
    }
    error(params: LoggingParams) {
        (this.client as IO.Socket).emit('error', params);
    }
    warning(params: LoggingParams) {
        (this.client as IO.Socket).emit('warning', params);
    }
    success(params: LoggingParams) {
        (this.client as IO.Socket).emit('success', params);
    }
    async question(params: {text: string, origin: string}): Promise<string> {
        return await new Promise((resolve) => {
            (this.client as IO.Socket).on('response', (response: string) => {
                resolve(response);
            });
            (this.client as IO.Socket).emit('question', params);
        });
    }
    async choices(params: {choices: string[], title: string, message: string}): Promise<{[name: string]: string}> {
        return await new Promise((resolve) => {
            (this.client as IO.Socket).on('choice', (response: {[name: string]: string}) => {
                resolve(response);
            });
            (this.client as IO.Socket).emit('choices', params);
        });
    }

    startProgress(params: {length: number; start: number; title: string}) {
        (this.client as IO.Socket).emit('startProgress', params);
    }
    progress(params: number) {
        (this.client as IO.Socket).emit('progress', params);
    }
    stoprProgress() {
        (this.client as IO.Socket).emit('stopProgress');
    }
}