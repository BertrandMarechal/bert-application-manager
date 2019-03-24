import pgPromise from "pg-promise";
import Utils from '.';

export default class Store {
    private db;
    private utils;
    private readonly pgp;

    constructor() {
        this.utils = new Utils();
        this.pgp = pgPromise();
        this.db = this.pgp(process.env.DATABASE_URL); // Postgres DB settings/params
    }

    async pgFunction(functionName, data = {}): Promise<[object]> {
        const payload = this.generatePayloadArray(data);

        const params = [
            ...payload
        ];

        const [err, result] = await this.utils.to(this.db.func(functionName, params));
        // this.pgp.end();

        if (err) throw err;

        return result[0][functionName];
    }

    generatePayloadArray(data: object) {
        let collection = [];

        for (let key in data) {
            collection.push(data[key])
        }

        return collection;
    }
}