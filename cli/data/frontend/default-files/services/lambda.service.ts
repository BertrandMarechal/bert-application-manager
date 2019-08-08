import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

declare var AWS: any;
const DELAY_FOR_LOGIN = 200;

export interface LambdaParams {
    apiName: string;
    functionName: string;
    payload?: any;
}

@Injectable({
    providedIn: 'root'
})
export class LambdaService {
    constructor() {
    }

    private getLambda(): any {
        // AWS.config.update({
        //     region: environment.region,
        // });
        // return new AWS.Lambda({
        //     region: environment.region,
        // });
        return {};
    }

    delay(t): any {
        return new Promise(function (resolve) {
            setTimeout(resolve, t);
        });
    }

    callLambdaPromise(params: LambdaParams): Promise<any> {
        return Promise.resolve({});
        // if (!this.globals.getGlobal('loggedIn')) {
        //   return this.delay(DELAY_FOR_LOGIN).then(() => {
        //     return this.callLambdaPromise(params);
        //   });
        // } else {
        //   if (params.functionName !== 'getuserdetails') {
        //     const lambdaParams = {
        //       FunctionName:
        //         `${params.apiName}-${environment.stage}-${params.functionName}`,
        //       Payload: JSON.stringify(params.payload)
        //     };
        //     return new Promise((resolve, reject) => {
        //       this.getLambda().invoke(lambdaParams, (err, data) => {
        //         if (err) {
        //           console.error(err);

        //           reject(err.stack);
        //         } else {
        //           const jsonObj = JSON.parse(data.Payload);
        //           if (jsonObj.success) {
        //             resolve(jsonObj.data);
        //           } else {
        //             console.error(err);
        //             console.error(data);
        //             reject(jsonObj);
        //           }
        //         }
        //       });
        //     });
        //   } else {
        //     if (typeof params.payload === 'string') {
        //       return new Promise((resolve, reject) => {
        //         reject('Please provide an object to callLambdas payload');
        //       });
        //     } else {
        //       const lambdaParams = {
        //         FunctionName:
        //           `${params.apiName}-${environment.stage}-${params.functionName}`,
        //         Payload: JSON.stringify(params.payload)
        //       };
        //       return new Promise((resolve, reject) => {
        //         this.getLambda().invoke(lambdaParams, (err, data) => {
        //           if (err) {
        //             console.error(err);

        //             reject(err.stack);
        //           } else {
        //             const jsonObj = JSON.parse(data.Payload);
        //             if (jsonObj.success) {
        //               resolve(jsonObj.data);
        //             } else if (data.Payload && data.Payload.indexOf('Task timed out after') > -1) {


        //               return this.callLambdaPromise(params);
        //             } else {
        //               console.error(err);

        //               reject(jsonObj);
        //             }
        //           }
        //         });
        //       });
        //     }
        //   }
        // }
    }
}
