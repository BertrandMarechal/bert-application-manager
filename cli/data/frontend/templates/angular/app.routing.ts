import {NgModule} from '@angular/core';
import {PreloadAllModules, RouterModule, Routes} from '@angular/router';
import {environment} from '@env/environment';

const homeRoutes: Routes = [
];
const routes: Routes = [
  {
    path: '',
    children: [
      ...homeRoutes,
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, environment.production ? {preloadingStrategy: PreloadAllModules} : null)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
