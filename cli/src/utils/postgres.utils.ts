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
                message: `Updated connection string, ${this.connectionString}`
            });
        }
        return this;
    }

    async execute(sql: string, data?: any): Promise<any> {
        try {
            if (data) {
                const dataToReturn: any = await this.db.any(sql, data);
                this.endConnection();
                return dataToReturn;
            } else {
                const dataToReturn: any = await this.db.any(sql);
                this.endConnection();
                return dataToReturn;
            }
        } catch (error) {
            throw error;
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
        this.pgp.end();
    }
}
