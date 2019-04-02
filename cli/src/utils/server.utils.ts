import axios, { AxiosResponse } from 'axios';
import path from 'path';
import { fork, spawn } from 'child_process';

export class ServerUtils {
    static async checkServer(check?: boolean): Promise<boolean> {
        try {
            const response: AxiosResponse = await axios.get('http://localhost:690/ping');
            if (response.data === 'pong') {
                if (check) {
                    console.log('Server connected !');
                }
                return true;
            }
        } catch (error) {
            if (check) {
                console.log('Server not connected');
            }
        }
        return false;
    }

    static async stopServer() {
        if (await ServerUtils.checkServer()) {
            try {
                const response: AxiosResponse = await axios.get('http://localhost:690/stop');
                if (response.data === 'stopped') {
                    console.log('Server stopped !');
                }
            } catch (error) {
                console.log('Error stopping the server');
            }
        } else {
            console.log('Server not connected');
        }
    }

    static async startServer() {
        if (!await ServerUtils.checkServer()) {
            try {
                const args = [
                    '/c',
                    'node',
                    path.resolve(process.argv[1], '../../../cli/build/server.js'),
                    '/b'
                ];
                // const child = fork(args[0]);
                const child = spawn('cmd', args, {
                    detached: true,
                    stdio: 'ignore'
                });
                console.log('Should be started now...');
            } catch (error) {
                console.log(error);
                console.log('Error starting the server');
            }
        } else {
            console.log('Server already connected');
        }
    }
    static async somethingChanged(applicationName: string) {
        try {
            const response: AxiosResponse = await axios.get('http://localhost:690/ping');
            if (response.data === 'pong') {
                await axios.post('http://localhost:690/cli/something-changed', {applicationName});
            }
        }
        catch(_e) {   
        }
    }
}