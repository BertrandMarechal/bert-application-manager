import { Observable } from 'rxjs';
import { ROUTER_NAVIGATION, RouterNavigationAction } from '@ngrx/router-store';
import { filter, map } from 'rxjs/operators';
import { ofType } from '@ngrx/effects';

export interface RouteNavigationParams {
  params: { [option: string]: string };
  queryParams: { [option: string]: string };
  url: string;
  targetUrl: string;
}

export class RouterUtilsService {
  static handleNavigationWithParams(segments: string | string[], actions: any):
    Observable<RouteNavigationParams> {
    segments = Array.isArray(segments) ? segments : [segments];
    const urls = segments.map(segment => segment[0] === '/' ? segment : '/' + segment);
    return actions.pipe(
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
