import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NavigationActionTiming, StoreRouterConnectingModule} from '@ngrx/router-store';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { AppMaterialModule } from './material/app.material.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { reducers } from './store/reducers/app.reducers';
import { applicationsReducers } from './store/reducers/applications.reducers';
import { ApplicationsEffects } from './store/effects/applications.effect';
import { HttpClientModule } from '@angular/common/http';
import { AngularSplitModule } from 'angular-split';
import { DatabasesEffects } from './store/effects/databases.effect';
import { databasesReducers } from './store/reducers/databases.reducers';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    AppMaterialModule,
    SweetAlert2Module.forRoot({}),
    BrowserAnimationsModule,
    AngularSplitModule.forRoot(),
    StoreRouterConnectingModule.forRoot({
      navigationActionTiming: NavigationActionTiming.PostActivation,
    }),
    StoreModule.forRoot(reducers),
    EffectsModule.forRoot([]),
    StoreModule.forFeature('applications', applicationsReducers),
    StoreModule.forFeature('databases', databasesReducers),
    EffectsModule.forFeature([
      ApplicationsEffects,
      DatabasesEffects,
    ])
  ],
  providers: [],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
