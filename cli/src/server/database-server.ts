import { ApplicationHelper } from '../classes/application/application-helper';
import { DatabaseFileHelper } from '../classes/database/database-file-helper';
import { DatabaseRepositoryReader } from '../classes/database/database-repo-reader';
import { DatabaseSubObject } from '../models/database-file.model';
import { Express, Request, Response } from 'express';
import { SocketUtils } from '../utils/socket.utils';
import { RepositoryUtils } from '../utils/repository.utils';
import { DatabaseInstaller } from '../classes/database/database-installer';
import { DatabaseTemplates } from '../classes/database/database-templates';
import { DatabaseTagger } from '../classes/database/database-tagger';
import { DatabaseChecker } from '../classes/database/database-checker';

export class DatabaseServer {
    static declareRoutes(app: Express, socketUtils: SocketUtils) {
        app.get('/databases/:name', async (req: Request, res: Response) => {
            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
        app.get('/databases/:name/refresh', async (req: Request, res: Response) => {
            await RepositoryUtils.readRepository({
                startPath: (await ApplicationHelper.getDatabase(req.params.name))._properties.path,
                type: 'postgres'
            }, socketUtils);
            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
        app.get('/databases/:name/check-parameters/:environment', async (req: Request, res: Response) => {
            await DatabaseRepositoryReader.checkParams({
                filter: req.params.name,
                environment: req.params.environment
            }, socketUtils);
            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
        app.get('/databases/:name/check-code', async (req: Request, res: Response) => {
            // this one can take a whilel we do not wait
            DatabaseChecker.checkCode({
                applicationName: req.params.name
            }, socketUtils);
            res.send('ongoing');
        });
        app.get('/databases/:name/install/:version/:env', async (req: Request, res: Response) => {
            console.log('databases/:name/install/:version/:env');
            try {
                await DatabaseInstaller.installDatabse({
                    applicationName: req.params.name,
                    environment: req.params.env,
                    version: req.params.version === 'all' ? null : req.params.version
                }, socketUtils)
                res.send();
            } catch (error) {
                console.log(error);
                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });
        app.post('/databases/:name/create-table', async (req: Request, res: Response) => {
            try {
                await DatabaseFileHelper.createTable({
                    applicationName: req.params.name,
                    tableDetails: req.body
                }, socketUtils);
                res.send(await ApplicationHelper.getDatabase(req.params.name));
            } catch (error) {
                console.log(error);
                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });
        app.post('/databases/:name/create-version', async (req: Request, res: Response) => {
            try {
                await DatabaseFileHelper.createVersion({
                    applicationName: req.params.name
                }, socketUtils);
                res.send(await ApplicationHelper.getDatabase(req.params.name));
            } catch (error) {
                console.log(error);
                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });
        app.post('/databases/:name/add-template', async (req: Request, res: Response) => {
            try {
                await DatabaseTemplates.addTemplate({
                    applicationName: req.params.name,
                    template: req.body.template
                }, socketUtils);
                res.send(await ApplicationHelper.getDatabase(req.params.name));
            } catch (error) {
                console.log(error);

                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });
        app.get('/databases/:name/create-functions', async (req: Request, res: Response) => {

            try {
                await DatabaseFileHelper.createFunctions({
                    applicationName: req.params.name,
                    filter: req.query.filter as string
                }, socketUtils);
                res.send(await ApplicationHelper.getDatabase(req.params.name));
            } catch (error) {
                console.log(error);

                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });
        app.get('/databases/:name/init', async (req: Request, res: Response) => {
            try {
                await DatabaseRepositoryReader.initDatabase({
                    applicationName: req.params.name
                }, socketUtils);
                res.send(await ApplicationHelper.getDatabase(req.params.name));
            } catch (error) {
                console.log(error);

                socketUtils.error({ origin: 'Server', message: JSON.stringify(error) })
            }
        });
        app.get('/databases/:name/:objectType', async (req: Request, res: Response) => {
            const db = await ApplicationHelper.getDatabase(req.params.name);
            let obj: { [name: string]: DatabaseSubObject } = {};
            switch (req.params.objectType) {
                case 'tables':
                    obj = db.table;
                    break;
                case 'functionsta':
                    obj = db.function;
                    break;
                default:
                    break;
            }
            res.send(obj);
        });
        app.post('/databases/:name/tables/:tableName/add-tag', async (req: Request, res: Response) => {
            await DatabaseTagger.addTagOnTable({
                applicationName: req.params.name,
                objectName: req.params.tableName,
                tagName: req.body.tagName,
                tagValue: req.body.tagValue,
            }, socketUtils);
            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
        app.post('/databases/:name/tables/:tableName/remove-tag', async (req: Request, res: Response) => {
            await DatabaseTagger.removeTagFromTable({
                applicationName: req.params.name,
                objectName: req.params.tableName,
                tagName: req.body.tagName,
            }, socketUtils);
            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
        app.post('/databases/:name/tables/:tableName/:field/add-tag', async (req: Request, res: Response) => {
            await DatabaseTagger.addTagOnField({
                applicationName: req.params.name,
                objectName: req.params.tableName,
                fieldName: req.params.field,
                tagName: req.body.tagName,
                tagValue: req.body.tagValue,
            }, socketUtils);
            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
        app.post('/databases/:name/tables/:tableName/:field/remove-tag', async (req: Request, res: Response) => {
            await DatabaseTagger.removeTagFromField({
                applicationName: req.params.name,
                objectName: req.params.tableName,
                fieldName: req.params.field,
                tagName: req.body.tagName,
            }, socketUtils);
            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
        app.get('/databases/:name/:objectType/:objectName/:version', async (req: Request, res: Response) => {
            const db = await ApplicationHelper.getDatabase(req.params.name);
            let obj: DatabaseSubObject = new DatabaseSubObject();

            switch (req.params.objectType) {
                case 'tables':
                    obj = db.table[req.params.objectName];
                    break;
                case 'functions':
                    obj = db.function[req.params.objectName];
                    break;
                default:
                    break;
            }
            if (req.params.version) {
                if (obj && obj.latestVersion !== req.params.version) {
                    // todo get the object in the required version
                }
            }
            res.send(obj);
        });
        app.post('/databases/:name/:objectType/:objectName/edit', async (req: Request, res: Response) => {
            let objectType = '';
            switch (req.params.objectType) {
                case 'tables':
                    objectType = 'table';
                    break;
                case 'functions':
                    objectType = 'function';
                    break;
                default:
                    break;
            }
            await DatabaseFileHelper.editObject({
                applicationName: req.params.name,
                objectName: req.params.objectName,
                objectType: objectType
            }, socketUtils);
            res.send(await ApplicationHelper.getDatabase(req.params.name));
        });
    }
}
