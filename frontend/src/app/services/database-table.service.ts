import { Injectable } from '@angular/core';
import { DatabaseTable, DatabaseTableForSave, DatabaseObject } from 'app/models/database-file.model';
import { LocalhostService } from './localhost.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseTableService {
  constructor(private localhostService: LocalhostService) { }

  async getDatabaseTables(databaseName: string): Promise<{[name: string]: DatabaseTable}> {
    return await this.localhostService.get(`databases/${databaseName}/tables`);
  }
  async getDatabaseTable(params: {
    databaseName: string;
    tableName: string;
    version?: string;
  }): Promise<DatabaseTable> {
    return await this.localhostService.get(`databases/${params.databaseName}/tables/${params.tableName}/${params.version}`);
  }

  async createDatabaseTable(params: {
    name: string;
    details: DatabaseTableForSave;
  }): Promise<DatabaseObject> {
    return await this.localhostService.post(`databases/${params.name}/create-table`, params.details);
  }

  async addTableTag(params: {
    name: string;
    tableName: string
    tagName: string;
    tagValue: string;
  }): Promise<DatabaseObject> {
    return await this.localhostService.post(`databases/${params.name}/tables/${params.tableName}/add-tag`, {
      tagName: params.tagName,
      tagValue: params.tagValue,
    });
  }

  async removeTableTag(params: {
    name: string;
    tableName: string
    tagName: string;
  }): Promise<DatabaseObject> {
    return await this.localhostService.post(`databases/${params.name}/tables/${params.tableName}/remove-tag`, {
      tagName: params.tagName,
    });
  }

  async addFieldTag(params: {
    name: string;
    tableName: string;
    fieldName: string;
    tagName: string;
    tagValue: string;
  }): Promise<DatabaseObject> {
    return await this.localhostService.post(`databases/${params.name}/tables/${params.tableName}/${params.fieldName}/add-tag`, {
      tagName: params.tagName,
      tagValue: params.tagValue,
    });
  }

  async removeFieldTag(params: {
    name: string;
    tableName: string;
    fieldName: string;
    tagName: string;
  }): Promise<DatabaseObject> {
    return await this.localhostService.post(`databases/${params.name}/tables/${params.tableName}/${params.fieldName}/remove-tag`, {
      tagName: params.tagName,
    });
  }
}
