import { DatabaseObject } from './database-file.model';

export interface Application {
    name: string;
    database: DatabaseObject;
    
    hasDatabase: boolean;
    hasMiddleTier: boolean;
    hasFrontend: boolean;
}
