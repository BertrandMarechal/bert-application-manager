import * as bodyParser from 'body-parser';
import express, { Express, Request, Response } from 'express';
import * as http from 'http';
import * as IO from "socket.io";
import { ApplicationHelper } from './classes/application/application-helper';
import { DatabaseServer } from './server/database-server';
import { SocketUtils } from './utils/socket.utils';

export class Server {
    private app: Express;
    private io: IO.Server;
    private server: http.Server;
    socketUtils: SocketUtils;

    constructor() {
        this.socketUtils = new SocketUtils();
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new IO.Server(this.server);
    }

    listen() {
        const [, , args] = process.argv;
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
        this.app.get('/applications', async (req: any, res: any) => {
            res.send(await ApplicationHelper.getApplications());
        });
        this.app.get('/applications/:name', async (req: Request, res: Response) => {
            res.send(await ApplicationHelper.getApplication(req.params.name));
        });
        this.app.post('/cli/something-changed', async (req: Request, res: Response) => {
            await this.socketUtils.emit('something-changed', req.body);
            res.send('ok');
        });

        DatabaseServer.declareRoutes(this.app, this.socketUtils);

        this.io.on('connection', (client: IO.Socket) => {
            console.log('Client connected');
            this._attachSocket(client);
        });
        const port = 690;

        this.server.listen(port, () => {
            console.log(`Listening on port ${port}`);
        });
    }
    private _attachSocket(client: IO.Socket) {
        this.socketUtils.attachClient(client);
    }
}
new Server().listen();
