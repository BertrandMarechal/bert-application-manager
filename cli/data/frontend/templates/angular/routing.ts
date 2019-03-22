import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

<components_imports>

const routes: Routes = [
<components_routes>
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class <capitalized_camel_cased_name>RoutingModule {
}
