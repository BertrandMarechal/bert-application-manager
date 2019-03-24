import {Actions, ofType} from '@ngrx/effects';
import {from, interval, Observable} from 'rxjs';
import {Action, Store} from '@ngrx/store';
import {catchError, mergeMap, withLatestFrom} from 'rxjs/operators';
import swal from 'sweetalert2';

const toast = (<any>swal).mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000
});

export class NgrxUtilsService {
  public static actionToServiceToAction(params: {
    actionsObs: Actions,
    actionsToListenTo: string[],
    serviceMethod: Function,
    payloadTransform?: (action: any, state?: any) => any,
    condition?: (action: any, state?: any) => boolean,
    outputTransform?: (data: any, action?: any, state?: any) => any,
    store?: Observable<Store<any>>,
    successToastMessage?: (data: any, action?: any, state?: any) => string,
    successSwalMessage?: (data: any, action?: any, state?: any) => string
  }): Observable<Action> {
    return params.actionsObs
      .pipe(
        ofType(...params.actionsToListenTo),
        // we wait 1ms if we do not have a store to resolve something (the interval)
        withLatestFrom(params.store || interval(1)),
        mergeMap(([action, state]: [{ type: string, payload?: any }, any]) => {
          const actionString = action.type.replace(/router|page|effect/gi, 'Service');
          if (params.condition) {
            if (!params.condition(action, state)) {
              return [{
                type: 'Nothing'
              }];
            }
          }
          let payload = action.payload;
          if (params.payloadTransform) {
            payload = params.payloadTransform(action, state);
          }
          let obs: Observable<any>;
          if (payload) {
            obs = from(params.serviceMethod(payload));
          } else {
            obs = from(params.serviceMethod());
          }

          return obs.pipe(
            mergeMap((data: any) => {
              if (params.successSwalMessage) {
                swal.fire({
                  type: 'success',
                  text: params.successSwalMessage(data, action, state)
                });
              } else if (params.successToastMessage) {
                toast({
                  type: 'success',
                  text: params.successToastMessage(data, action, state)
                });
              }
              return [
                {
                  type: actionString + ' complete',
                  payload: params.outputTransform ? params.outputTransform(data, action, state) : data
                }
              ];
            }),
            catchError((error: any) => {
              console.error(error);
              swal.fire({
                type: 'error',
                text: (error.message ? (error.message + ' ' + error.error || '') : error)
              });
              return [
                {
                  type: actionString + ' failed',
                  payload: error.message
                }
              ];
            })
          );
        }),
      );
  }

  public static actionToAction(params: {
    actionsObs: Actions,
    actionsToListenTo: string[],
    actionToDispatch: string,
    condition?: (action: any, state?: any) => boolean,
    payloadTransform?: (action: any, state?: any) => any,
    store?: Observable<Store<any>>
  }): Observable<Action> {
    return params.actionsObs
      .pipe(
        ofType(...params.actionsToListenTo),
        withLatestFrom(params.store || interval(1)),
        mergeMap(([action, state]: [{ type: string, payload?: any }, any]) => {
          if (params.condition) {
            if (!params.condition(action, state)) {
              return [{
                type: 'Nothing'
              }];
            }
          }
          return [{
            type: params.actionToDispatch,
            payload: params.payloadTransform ? params.payloadTransform(action, state) : action.payload
          }];
        }),
        catchError((error: any) => {
          console.error(error);
          swal.fire({
            type: 'error',
            text: (error.message ? (error.message + ' ' + error.error || '') : error)
          });
          return [
            {
              type: 'failed',
              payload: error.message
            }
          ];
        })
      );
  }
}
