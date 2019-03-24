import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as io from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root'
})
export class LocalhostService {
  socketManagement: any;
  socketLambda: any;
  serverConnected: boolean;
  constructor(private httpClient: HttpClient) {
    console.log('LocalhostService');
    this.socketManagement = io.connect('http://localhost:' + environment.nodeServerPort);
    this.socketManagement.on('connect', () => {
      console.log('connect');
      this.serverConnected = true;
    });
    this.socketManagement.on('disconnect', () => {
      this.serverConnected = false;
    });
  }

  private _waitForConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.serverConnected) {
        resolve();
      } else {
        setTimeout(() => {
          this._waitForConnection()
            .then(resolve)
            .catch(reject);
        }, 200);
      }
    });
  }

  async get<T>(url: string): Promise<T> {
    await this._waitForConnection();
    const httpOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'same-origin',
    };
    return <T>(
      await this.httpClient
        .get(`http://localhost:${environment.nodeServerPort}/${url}`, httpOptions)
        .toPromise()
      );
  }
  post(url: string, body: any) {
    const httpOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'same-origin',
    };
    return new Promise((resolve, reject) => {
      this._waitForConnection()
        .then(() => {
          this.httpClient.post(`http://localhost:${environment.nodeServerPort}/${url}`,
            body,
            httpOptions).toPromise()
            .then((result) => {
              resolve(result);
            })
            .catch((result) => {
              reject({ Payload: JSON.stringify(result) });
            });
        })
        .catch((result) => {
          reject(result);
        });
    });
  }
  
  hookManagementCallback(event: string, callback) {
    this.socketManagement.on(event, (data) => {
      callback(data);
    });
  }
  hookLambdaCallback(event: string, callback) {
    this.socketLambda.on(event, (data) => {
      callback(data);
    });
  }
  socketEmit(event: string, data: any) {
    this._waitForConnection()
      .then(() => {
        this.socketManagement.emit(event, data, () => { });
      }).catch((error) => {
        console.log(error);
      });
  }
  hookManagementPromise(event: string, callback) {
    return new Promise((resolve, reject) => {
      this._waitForConnection()
        .then(() => {
          this.socketManagement.on(event, (data) => {
            resolve(data);
          });
        })
        .catch (reject);
    });
  }
  hookLambdaPromise(event: string, callback) {
    return new Promise((resolve, reject) => {
      this._waitForConnection()
        .then(() => {
          this.socketLambda.on(event, (data) => {
            resolve(data);
          });
        })
        .catch (reject);
    });
  }
  removeAllListeners(events: string[]) {
    events.forEach(x => {
      this.socketManagement.removeAllListeners(x);
    })
  }
}
