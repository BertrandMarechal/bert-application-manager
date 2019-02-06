import express from 'express';
import * as http from 'http';
import * as bodyParser from 'body-parser';
import { OpenBrowserUtils } from '../utils/open-browser.utils';

export class MockServer {
    private app: any;
    private server: http.Server;

    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
    }

    listen () {
        const [,,args] = process.argv;
        this.app.use((req: any, res: any, next: any) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        this.app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
        this.app.use(bodyParser.json({ limit: '50mb' })); // to support JSON-encoded bodies
        
        this.app.get('/test', (req: any, res: any) => {
            res.send({ data: 'Yeah' });
        });
        this.app.get('/ping', (req: any, res: any) => {
            res.send('pong');
        });
        this.app.get('/stop', (req: any, res: any) => {
            this.server.close();
            res.send('stopped');
        });
        this.app.get('', (req: any, res: any) => {
            res.send('<a href="/test">test</a><br><a href="/stop">stop</a>');
        });
        const port = 690;

        this.server.listen(690, (error: any) => {
            console.log(`Listening on port ${port}`);
            OpenBrowserUtils.open(`http://localhost:${port}`);
        });
    }
}