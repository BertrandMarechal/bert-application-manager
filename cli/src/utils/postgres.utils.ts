import PGP from 'pg-promise';
import { UiUtils } from './ui.utils';

export class PostgresUtils {
    db: any;
    pgp: any;
    private connectionString: string;
    connections: {
        [connectionString: string]: any
    };

    constructor() {
        this.connectionString = '';
        this.pgp = PGP();
        this.connections = {};
    }

    setConnectionString(connectionString: string, uiUtils: UiUtils) {
        if (this.connectionString !== connectionString) {
            this.connectionString = connectionString;
            if (!this.connections[this.connectionString]) {
                this.connections[this.connectionString] = this.pgp(this.connectionString);
            }
            this.db = this.connections[this.connectionString];
            uiUtils.info({
                origin: 'PostgresUtils',
                message: `Updated connection string, ${this.connectionString.replace(/\:.*?\@/gi, ':XXXXXXXXX@')}`
            });
        }
        return this;
    }

    async execute(sql: string, data?: any): Promise<any> {
        if (data) {
            return this.db.any(sql, data);
        } else {
            return this.db.any(sql);
        }
    }

    executeFunction(sql: string, data?: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (data) {
                this.db.func(sql, data)
                    .then((data: any) => {
                        this.endConnection();
                        resolve(data);
                    })
                    .catch((error: any) => {
                        console.log(sql);
                        console.log(error);
                        reject(error);
                        this.endConnection();
                    });
            } else {
                this.db.func(sql)
                    .then((data: any) => {
                        this.endConnection();
                        resolve(data);
                    })
                    .catch((error: any) => {
                        console.log(sql);
                        console.log(error);
                        reject(error);
                        this.endConnection();
                    });
            }
        });
    }

    endConnection() {
        if (this.db) {
            for (let key of Object.keys(this.connections)) {
                if (this.connections[key] === this.db) {
                    this.connections[key] = undefined;
                    this.db?.$pool?.end();
                }
            }
        }
    }

    endAllConnections() {
        this.db = null;
        for (let key of Object.keys(this.connections)) {
            this.connections[key]?.$pool?.end();
            this.connections[key] = undefined;
        }
    }
}
