
export type LambdaFunctionEventType = 's3';
export type LambdaFunctionEventRuleType = 'prefix' | 'suffix';
export interface LambdaFunctionEventRule {
    value: string;
    type: LambdaFunctionEventRuleType;
}
export interface LambdaFunctionEventParam {
    bucket?: string;
    event?: string;
    rules?: LambdaFunctionEventRule[]
}
export interface LambdaLayer {
    name: string;
}
export class LambdaFunctionEvent {
    type: LambdaFunctionEventType;
    params: LambdaFunctionEventParam;
    constructor(params?: any) {
        this.type = 's3';
        this.params = {};

        if (params) {
            if (params.s3) {
                this.type = 's3';
                this.params = {
                    bucket: params.s3.bucket,
                    event: params.s3.event,
                    rules: params.s3.rules.map((x: { suffix?: string, prefix?: string }) => {
                        if (x.suffix) {
                            return {
                                type: 'suffix',
                                value: x.suffix
                            };
                        }
                        if (x.prefix) {
                            return {
                                type: 'prefix',
                                value: x.prefix
                            };
                        }
                    })
                };
            }
        }
    }
}

export class LambdaFunction {
    name: string;
    handler: string;
    handlerFunctionName: string;
    events: LambdaFunctionEvent[];
    layers: LambdaLayer[];

    constructor(params?: any) {
        this.name = '';
        this.handler = ''
        this.handlerFunctionName = '';
        this.events = [];
        this.layers = [];
        if (params) {
            this.name = params.functionName;
            this.handler = params.handler.split('.')[0];
            this.handlerFunctionName = params.handler.split('.')[1];
            if (params.events) {
                this.events = params.events.map((x: any) => new LambdaFunctionEvent(x));
            }
            if (params.layers) {
                this.layers = params.layers.map((x: string) => { name: x });
            }
        }
    }
}

export class ServerlessFile {
    fileName: string;
    serviceName: string;
    environmentVariables: { key: string, value: string, variableFileName?: string, declared: boolean }[];
    functions: LambdaFunction[];

    constructor(params?: any) {
        this.fileName = '';
        this.serviceName = ''
        this.environmentVariables = [];
        this.functions = [];
        if (params) {
            this.fileName = params.fileName;
            this.serviceName = params.service;
            if (params.provider.environment) {
                this.environmentVariables = Object.keys(params.provider.environment).map(x => {
                    return {
                        key: x,
                        value: params.provider.environment[x],
                        declared: true
                    };
                });
            }
            this.functions = Object.keys(params.functions)
                .map(x => new LambdaFunction({ ...params.functions[x], functionName: x }));
        }
    }
}