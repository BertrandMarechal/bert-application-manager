import express, { Express, Request, Response } from 'express';
import * as http from 'http';
import * as bodyParser from 'body-parser';
import { OpenBrowserUtils } from './utils/open-browser.utils';
import graphqlHTTP from 'express-graphql';
import { buildSchema } from 'graphql';
import { SocketUtils } from './utils/socket.utils';
import { ApplicationHelper } from './classes/application/application-helper';
import IO from "socket.io";
import { DatabaseFileHelper } from './classes/database/database-file-helper';
import { DatabaseRepositoryReader } from './classes/database/database-repo-reader';
import { RepositoryUtils } from './utils/repository.utils';
// const graphqlHTTP = require('express-graphql');
// import {buildSchema} from 'graphql';

export class Server {
    private app: Express;
    private io: IO.Server;
    private server: http.Server;
    socketUtils: SocketUtils;

    constructor() {
        this.socketUtils = new SocketUtils();
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = IO(this.server);
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
        this.app.get('/databases/:name', async (req: Request, res: Response) => {
            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
        this.app.get('/databases/:name/refresh', async (req: Request, res: Response) => {
            await RepositoryUtils.readRepository({
                startPath: (await ApplicationHelper.getDatabase(req.params.name))._properties.path,
                type: 'postgres'
            }, this.socketUtils);
            console.log(req.params.name);

            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
        this.app.post('/databases/:name/create-table', async (req: Request, res: Response) => {
            try {
                await DatabaseFileHelper.createTable({
                    applicationName: req.params.name + '-database',
                    tableDetails: req.body
                }, this.socketUtils);
                res.send(await ApplicationHelper.getDatabase(req.params.name));
            } catch (error) {
                console.log(error);
                this.socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });
        this.app.post('/databases/:name/add-template', async (req: Request, res: Response) => {
            try {
                await DatabaseFileHelper.addTemplate({
                    applicationName: req.params.name + '-database',
                    template: req.body.template
                }, this.socketUtils);
                res.send(await ApplicationHelper.getDatabase(req.params.name));
            } catch (error) {
                console.log(error);

                this.socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });
        this.app.get('/databases/:name/create-functions', async (req: Request, res: Response) => {
            try {
                await DatabaseFileHelper.createFunctions({
                    applicationName: req.params.name + '-database',
                    filter: req.query.filter
                }, this.socketUtils);
                res.send(await ApplicationHelper.getDatabase(req.params.name));
            } catch (error) {
                console.log(error);

                this.socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });
        this.app.get('/databases/:name/init', async (req: Request, res: Response) => {
            try {
                await DatabaseRepositoryReader.initDatabase({
                    applicationName: req.params.name + '-database'
                }, this.socketUtils);
                res.send(await ApplicationHelper.getDatabase(req.params.name));
            } catch (error) {
                console.log(error);

                this.socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });

        /*
        const schema = buildSchema(`
            type Query {
                hello: String
            }
        `);
        // The root provides a resolver function for each API endpoint
        const root = {
          hello: () => 'Hello world!',
        };
        this.app.use('/graphql', graphqlHTTP({
            schema: schema,
            rootValue: root,
            graphiql: true
        }));
        */

        this.io.on('connection', (client: IO.Socket) => {
            console.log('Client connected');
            this._attachSocket(client);
        });
        const port = 690;

        this.server.listen(port, (error: any) => {
            console.log(`Listening on port ${port}`);
            // OpenBrowserUtils.open(`http://localhost:${port}`);
        });
    }
    private _attachSocket(client: IO.Socket) {
        this.socketUtils = new SocketUtils(client);
    }
}
new Server().listen();