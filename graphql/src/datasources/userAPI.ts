import { RESTDataSource } from 'apollo-datasource-rest';
import Utils from '../utils';
import { User } from "./model";

export default class UserAPI extends RESTDataSource {
    private utils;
    private store;

    constructor({ store }) {
        super();
        this.utils = new Utils();
        this.store = store;
    }

    async getUsers(): Promise<User[]> {
        const users = await this.store.pgFunction('get_user');

        return users.map(user => this.reducer(user));
    }

    async createUser(user: User): Promise<User[]> {
        const result = await this.store.pgFunction('create_user', user);

        return result.map(data => this.reducer(data));
    }

    private reducer(user): User {
        return {
            id: user.usr_uuid,
            firstName: user.usr_first_name,
            lastName: user.usr_last_name,
            gender: user.usr_gender,
            email: user.usr_email
        }
    }
}
