import { AppState } from './app.reducers';
import * as ApplicationsActions from '../actions/applications.actions';
import { Application } from 'app/models/application.model';

export interface FeatureState extends AppState {
    applications: State;
}

export interface State {
    gettingApplications: boolean;
    gettingApplication: boolean;
    applications: string[];
    application: Application;
}

const applicationsInitialState: State = {
    gettingApplications: false,
    gettingApplication: false,
    applications: null,
    application: null
};

export function applicationsReducers(
    state = applicationsInitialState,
    action: ApplicationsActions.ApplicationsActions
) {
    switch (action.type) {
        case ApplicationsActions.EFFECT_GET_APPLICATIONS:
            return {
                ...state,
                gettingApplications: true,
            };
        case ApplicationsActions.SERVICE_GET_APPLICATIONS_COMPLETE:
            return {
                ...state,
                gettingApplications: false,
                applications: action.payload
            };
        case ApplicationsActions.SERVICE_GET_APPLICATIONS_FAILED:
            return {
                ...state,
                gettingApplications: false
            };
        case ApplicationsActions.EFFECT_GET_APPLICATION:
            return {
                ...state,
                gettingApplication: true,
            };
        case ApplicationsActions.SERVICE_GET_APPLICATION_COMPLETE:
            return {
                ...state,
                gettingApplication: false,
                application: action.payload
            };
        case ApplicationsActions.SERVICE_GET_APPLICATION_FAILED:
            return {
                ...state,
                gettingApplication: false
            };
        default:
            break;
    }
    return state;
}