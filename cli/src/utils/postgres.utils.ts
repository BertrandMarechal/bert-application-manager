import PGP from 'pg-promise';

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

    setConnectionString(connectionString: string) {
        if (this.connectionString !== connectionString) {
            this.connectionString = connectionString;
            if (!this.connections[this.connectionString]) {
                this.connections[this.connectionString] = this.pgp(this.connectionString);
            }
            this.db = this.connections[this.connectionString];
        }
        return this;
    }

    execute (sql: string, data?: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if (data) {
                this.db.any(sql, data)
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
                this.db.any(sql)
                    .then((data: any) => {
                        this.endConnection();
                        resolve(data);
                    })
                    .catch((error: any) => {
                        console.log(sql);
                        console.log(this.connectionString);
                        console.log(error);
                        reject(error);
                        this.endConnection();
                    });
            }
        });
    }

    executeFunction (sql: string, data?: any[]): Promise<any> {
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