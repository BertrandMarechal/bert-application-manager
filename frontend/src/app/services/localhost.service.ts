import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as io from 'socket.io-client';
import { environment } from '@env/environment';
import { Store } from '@ngrx/store';
import Swal from 'sweetalert2';
import * as fromDatabases from '@app/store/reducers/databases.reducers';
import * as DatabasesActions from '@app/store/actions/databases.actions';
import * as ConsoleActions from '@app/store/actions/console.actions';

export type LoggerType = 'info' | 'warning' | 'error' | 'success';
export type LoggerColors = 'red' | 'grey' | 'green' | 'blue' | 'cyan' | 'white' | 'yellow' | 'grey';

export interface LoggingParams {
  origin: string;
  message: string;
  type?: LoggerType;
  color?: LoggerColors;
  batchId?: number;
}
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000
});

@Injectable({
  providedIn: 'root'
})
export class LocalhostService {
  socketManagement: any;
  socketLambda: any;
  serverConnected: boolean;
  constructor(
    private httpClient: HttpClient,
    private store: Store<fromDatabases.FeatureState>
  ) {
    this.socketManagement = io.connect('http://localhost:' + environment.nodeServerPort);
    this.socketManagement.on('connect', () => {
      this.serverConnected = true;
      this._plugUiUtils();
      this._plugSocketToActions();
    });
    this.socketManagement.on('disconnect', () => {
      this.serverConnected = false;
      this.removeAllListeners([
        'something-changed',
        'log',
        'info',
        'success',
        'warning',
        'error',
        'question',
        'choices',
        'startProgress',
        'progress',
        'stopProgress',
      ]);
    });
  }

  private _plugSocketToActions() {
    this.socketManagement.on('something-changed', (params: { applicationName: string }) => {
      if (/-database/i.test(params.applicationName)) {
        this.store.dispatch(new DatabasesActions.EffectGetDatabase(params.applicationName));
      }
    });
  }

  private _preProcessStrings(params: any): any {
    const newMessage = {
      ...params
    };
    if (newMessage.message) {
      newMessage.message = params.message.replace(/\u001b\[[0-9]{1,2}m/g, '');
    }
    if (newMessage.title) {
      newMessage.title = params.title.replace(/\u001b\[[0-9]{1,2}m/g, '');
    }
    if (newMessage.text) {
      newMessage.text = params.text.replace(/\u001b\[[0-9]{1,2}m/g, '');
    }
    return newMessage;
  }

  private _plugUiUtils() {
    this.socketManagement.on('log', (params: LoggingParams) => {
      params.type = 'info';
      this._preProcessStrings(params);
      this.store.dispatch(new ConsoleActions.ServiceNotification({ type: 'info', params }));
    });
    this.socketManagement.on('info', (params: LoggingParams) => {
      params.type = 'info';
      this._preProcessStrings(params);
      this.store.dispatch(new ConsoleActions.ServiceNotification({ type: 'info', params }));
    });
    this.socketManagement.on('success', (params: LoggingParams) => {
      params.type = 'success';
      this._preProcessStrings(params);
      this.store.dispatch(new ConsoleActions.ServiceNotification({ type: 'success', params }));
      Toast.fire({
        type: 'success',
        html: `${params.origin} - ${params.message.replace(/\u001b\[[0-9]{1,2}m/g, '')}`
      });
    });
    this.socketManagement.on('warning', (params: LoggingParams) => {
      params.type = 'warning';
      this._preProcessStrings(params);
      this.store.dispatch(new ConsoleActions.ServiceNotification({ type: 'warning', params }));
      Toast.fire({
        type: 'warning',
        html: `${params.origin} - ${params.message.replace(/\u001b\[[0-9]{1,2}m/g, '')}`
      });
    });
    this.socketManagement.on('error', (params: LoggingParams) => {
      params.type = 'error';
      this._preProcessStrings(params);
      this.store.dispatch(new ConsoleActions.ServiceNotification({ type: 'error', params }));
      Toast.fire({
        type: 'error',
        html: `${params.origin} - ${params.message.replace(/\u001b\[[0-9]{1,2}m/g, '')}`
      });
    });
    this.socketManagement.on('question', async (params: { text: string, origin: string }) => {
      this._preProcessStrings(params);
      const returnValue = await Swal.fire({
        text: params.text.replace(/\u001b\[[0-9]{1,2}m/g, ''),
        type: 'question',
        input: 'text',
        showCancelButton: true
      });
      this.socketManagement.emit('response', returnValue.value);
    });
    this.socketManagement.on('choices', async (params: { choices: string[], title: string, message: string }) => {
      this._preProcessStrings(params);
      const returnValue = await Swal.fire({
        text: params.message,
        type: 'question',
        title: params.title,
        input: 'select',
        inputOptions: params.choices.reduce((agg, curr) => ({ ...agg, [curr]: curr }), {}),
        showCancelButton: true
      });
      this.socketManagement.emit('choice', { [params.title]: returnValue.value });
    });
    this.socketManagement.on('startProgress', (params: { length: number; start: number; title: string }) => {
      this._preProcessStrings(params);
      this.store.dispatch(new ConsoleActions.ServiceStartProgress({
        current: params.start,
        length: params.length,
        title: params.title
      }));
    });
    this.socketManagement.on('progress', (params: number) => {
      this.store.dispatch(new ConsoleActions.ServiceProgress(params));
    });
    this.socketManagement.on('stopProgress', () => {
      this.store.dispatch(new ConsoleActions.ServiceStopProgress());
    });
  }

  private _waitForConnection(): Promise<void> {
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
    return <T>await this.httpClient
      .get(`http://localhost:${environment.nodeServerPort}/${url}`, httpOptions)
      .toPromise();
  }
  async post<T>(url: string, body?: any): Promise<T> {
    const httpOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'no-cors',
      cache: 'no-cache',
      credentials: 'same-origin',
    };
    await this._waitForConnection();
    return <T>await this.httpClient.post(
      `http://localhost:${environment.nodeServerPort}/${url}`,
      body,
      httpOptions).toPromise();
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
  async socketEmit(event: string, data: any) {
    await this._waitForConnection();
    await this.socketManagement.emit(event, data, () => { });
  }
  hookManagementPromise(event: string, callback) {
    return new Promise((resolve, reject) => {
      this._waitForConnection()
        .then(() => {
          this.socketManagement.on(event, (data) => {
            resolve(data);
          });
        })
        .catch(reject);
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
        .catch(reject);
    });
  }
  removeAllListeners(events: string[]) {
    events.forEach(x => {
      this.socketManagement.removeAllListeners(x);
    });
  }
}
