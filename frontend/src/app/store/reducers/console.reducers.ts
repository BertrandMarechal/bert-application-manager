import { AppState } from './app.reducers';
import * as ConsoleActions from '../actions/console.actions';
import { LoggingParams, LoggerType } from '@app/services/localhost.service';

export interface FeatureState extends AppState {
    console: State;
}

export interface State {
    notifications: { type: LoggerType, params: LoggingParams }[];
    progress: { length: number; current: number; title: string };
}

const consoleInitialState: State = {
    notifications: [],
    progress: null,
};


export function consoleReducers(
    state = consoleInitialState,
    action: ConsoleActions.ConsoleActions
) {
    switch (action.type) {
        case ConsoleActions.SERVICE_NOTIFICATION:
            return {
                ...state,
                notifications: [
                    action.payload,
                    ...state.notifications.splice(0, 24)
                ]
            };
        case ConsoleActions.SERVICE_START_PROGRESS:
            return {
                ...state,
                progress: action.payload
            };
        case ConsoleActions.SERVICE_PROGRESS:
            return {
                ...state,
                progress: {
                    ...state.progress,
                    current: action.payload
                }
            };
        case ConsoleActions.SERVICE_STOP_PROGRESS:
            return {
                ...state,
                progress: null
            };
        default:
            break;
    }
    return state;
}
