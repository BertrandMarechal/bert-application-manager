import { Injectable } from '@angular/core';
import { LocalhostService } from './localhost.service';
import { DatabaseObject, DatabaseTableForSave } from 'app/models/database-file.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  constructor(private localhostService: LocalhostService) { }

  async getDatabase(name: string): Promise<DatabaseObject> {
    return await this.localhostService.get(`databases/${name}`);
  }

  async createDatabaseTable(params: {name: string, details: DatabaseTableForSave}): Promise<DatabaseObject> {
    return await this.localhostService.post(`databases/${params.name}/create-table`, params.details);
  }

  async createDatabaseFunctions(name: string): Promise<DatabaseObject> {
    return await this.localhostService.get(`databases/${name}/create-functions`);
  }

  async initializeDatabase(name: string): Promise<DatabaseObject> {
    return await this.localhostService.get(`databases/${name}/init`);
  }
}
