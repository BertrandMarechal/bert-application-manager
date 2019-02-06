import * as childProcess from 'child_process';

export class OpenBrowserUtils {
    static open(url: string) {
        const args = [
            '/c',
            'start',
            '""',
            '/b'
        ];
        args.push(url.replace(/&/g, '^&'));
        childProcess.spawn('cmd', args, {});
    }
}