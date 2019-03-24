import {ActivatedRouteSnapshot} from '@angular/router';
import {Observable, of} from 'rxjs';
import {ROUTER_NAVIGATION, RouterNavigationAction} from '@ngrx/router-store';
import {catchError, filter, map, switchMap, withLatestFrom} from 'rxjs/operators';
import {ofType, Actions} from '@ngrx/effects';

export interface RouteNavigationParams {
  params: { [option: string]: string };
  queryParams: { [option: string]: string };
  url: string;
  targetUrl: string;
}

export class RouterUtilsService {
  static handleNavigationWithParams(params: {
      urls: string | string[],
      actionsObs: Actions
    }):
    Observable<RouteNavigationParams> {
    params.urls = Array.isArray(params.urls) ? params.urls : [params.urls];
    const urls = params.urls.map(segment => segment[0] === '/' ? segment : '/' + segment);
    return params.actionsObs.pipe(
      ofType(ROUTER_NAVIGATION),
      map((x: RouterNavigationAction) => {
        if (x.payload.event.url) {
          let returnObject: RouteNavigationParams = null;
          let ok;
          for (let i = 0; i < urls.length && !ok; i++) {
            ok = true;
            const url = urls[i];
            const urlSplit = url.split('?')[0].split('/');
            const urlEventSplit = x.payload.event.url.split('?')[0].split('/');
            const returnObjectParams: { [option: string]: string } = {};
            for (let j = 0; j < urlSplit.length && ok; j++) {
              const item = urlSplit[j];
              if (item[0] === ':') {
                returnObjectParams[item.substring(1)] = urlEventSplit[j];
              } else {
                ok = item === '*' || item === urlEventSplit[j];
              }
            }
            const paramsSplit = x.payload.event.url.split('?')[1] ? x.payload.event.url.split('?')[1].split('&') : [];
            returnObject = {
              url: url,
              targetUrl: x.payload.event.url,
              params: returnObjectParams,
              queryParams: paramsSplit
                .map(y => y.split('='))
                .reduce((agg, [name, value]: [string, string]) => {
                  agg[name] = value;
                  return agg;
                }, {})
            };
          }
          return ok ? returnObject : null;
        }
        return null;
      }),
      filter(Boolean)
    );
  }
}
