import { Injectable } from '@angular/core';
import { LocalhostService } from './localhost.service';
import { Application } from 'app/models/application.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicationsService {
  constructor(private localhostService: LocalhostService) { }

  async getApplications(): Promise<string[]> {
    return await this.localhostService.get('applications');
  }
  async getApplication(name: string): Promise<string[]> {
    return await this.localhostService.get(`applications/${name}`);
  }
}
