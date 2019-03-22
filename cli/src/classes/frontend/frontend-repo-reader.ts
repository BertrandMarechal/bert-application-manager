import { UiUtils } from '../../utils/ui.utils';

const packagesToInstall = [
    '@ngrx/effects',
    '@ngrx/router-store',
    '@ngrx/store',
    '@ngrx/store-devtools',
    '@toverux/ngx-sweetalert2',
    'angular-split',
    'core-js',
    'hammerjs',
    'ngx-analytics',
    'ngx-cookie-service',
    'rxjs',
    'rxjs-compat',
    'sweetalert2',
    '@angular/router',
    '@angular/animations',
    '@angular/cdk',
];


export class FrontendRepositoryReader {
    private static _origin = 'FrontendRepositoryReader';

    static async readRepo(startPath: string, repoName: string, uiUtils: UiUtils, silent?: boolean) {
        // todo
        uiUtils.success({ origin: FrontendRepositoryReader._origin, message: `Repository read` });
    }

}