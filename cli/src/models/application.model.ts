import { DatabaseObject } from "./database-file.model";

export interface Application {
    name: string;
    database: DatabaseObject;
}