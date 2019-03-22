import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MiddleTiersComponent } from './middle-tiers.component';
import { MiddleTierComponent } from './middle-tier/middle-tier.component';
import { FunctionComponent } from './middle-tier/function/function.component';

@NgModule({
  declarations: [MiddleTiersComponent, MiddleTierComponent, FunctionComponent],
  imports: [
    CommonModule
  ]
})
export class MiddleTiersModule { }
