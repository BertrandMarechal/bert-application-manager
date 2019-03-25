import { Injectable } from '@angular/core';
import { LocalhostService } from './localhost.service';
import { DatabaseObject } from 'app/models/database-file.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  constructor(private localhostService: LocalhostService) { }

  async getDatabase(name: string): Promise<DatabaseObject> {
    return await this.localhostService.get(`databases/${name}`);
  }

  async createDatabaseTable(name: string): Promise<DatabaseObject> {
    return await this.localhostService.get(`databases/${name}/create-table`);
  }

  async createDatabaseFunctions(name: string): Promise<DatabaseObject> {
    return await this.localhostService.get(`databases/${name}/create-functions`);
  }
}
