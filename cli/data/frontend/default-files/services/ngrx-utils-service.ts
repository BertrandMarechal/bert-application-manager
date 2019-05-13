import {Actions, ofType} from '@ngrx/effects';
import {from, interval, Observable} from 'rxjs';
import {Action, Store} from '@ngrx/store';
import {catchError, mergeMap, withLatestFrom} from 'rxjs/operators';
import Swal from 'sweetalert2';

const toast = Swal.mixin({
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
    payloadTransform?: (action: any, state?: any, state2?: any) => any,
    condition?: (action: any, state?: any, state2?: any) => boolean,
    outputTransform?: (data: any, action?: any, state?: any, state2?: any) => any,
    store?: Observable<Store<any>>,
    store2?: Observable<Store<any>>,
    successToastMessage?: (data: any, action?: any, state?: any, state2?: any) => string,
    successSwalMessage?: (data: any, action?: any, state?: any, state2?: any) => string
  }): Observable<Action> {
    return params.actionsObs
      .pipe(
        ofType(...params.actionsToListenTo),
        // we wait 1ms if we do not have a store to resolve something (the interval)
        withLatestFrom(params.store || interval(1)),
        withLatestFrom(params.store2 || interval(1)),
        mergeMap(([[action, state], state2]: [[{ type: string, payload?: any }, any], any]) => {
          const actionString = action.type.replace(/router|page|effect|force/gi, 'Service');
          if (params.condition) {
            if (!params.condition(action, state, state2)) {
              return [{
                type: 'Nothing'
              }];
            }
          }
          let payload = action.payload;
          if (params.payloadTransform) {
            payload = params.payloadTransform(action, state, state2);
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
                Swal.fire({
                  type: 'success',
                  text: params.successSwalMessage(data, action, state, state2)
                });
              } else if (params.successToastMessage) {
                toast.fire({
                  type: 'success',
                  text: params.successToastMessage(data, action, state, state2)
                });
              }
              return [
                {
                  type: actionString + ' complete',
                  payload: params.outputTransform ? params.outputTransform(data, action, state, state2) : data
                }
              ];
            }),
            catchError((error: any) => {
              console.error(error);
              Swal.fire({
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
          Swal.fire({
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
