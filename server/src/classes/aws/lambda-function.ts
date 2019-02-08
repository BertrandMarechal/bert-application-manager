// declare var require: any;
// declare var process: any;
// import path from 'path';

// const originFolder = process.argv[3] || '../repos/';

// export class LambdaFunctionFromFile {
//     [name: string]: any;
//     functionName: string;
//     fileName: string;
//     handlerFunctionName: string;
//     parameters: {
//         [name: string]: string;
//         name: string,
//         value: string
//     }[];

//     constructor(params: any) {
//         this.fileName = '';
//         this.handlerFunctionName = '';
//         this.functionName = '';
//         this.parameters = [];

//         for (let key in params) {
//             if (params.hasOwnProperty(key)) {
//                 this[key] = params[key];
//             }
//         }
//     }
// }

// export class LambdaFunction extends LambdaFunctionFromFile {
//     constructor(params: any) {
//         super(params);
//         for (let key in params) {
//             if (params.hasOwnProperty(key)) {
//                 this[key] = params[key];
//             }
//         }
//     }
//     get fileNameFormatedForRequire() {
//         return path.resolve(__dirname, '..', originFolder, this.fileName.replace('//','/') + '.js');
//     }
//     call(event: any, context: any, callback: Function) {
//         this.parameters.forEach((x) => {
//             process.env[x.name] = x.value;
//         });
        
//         const lambdaFunction = require(this.fileNameFormatedForRequire);
//         lambdaFunction[this.handlerFunctionName](event, context, callback);
//     }
// }