// import {FileUtils} from "../utils/file.utils";
// import fs from 'fs';
// import path from "path";
// import { PostgresUtils } from "../utils/postgres.utils";
// import { TEMP_FOLDER } from "../classes/lambda-server";

// const S3_FOLDER: string = TEMP_FOLDER + 's3/';
// export type S3SignedUrlType = 'getObject' | 'putObject';
// export interface S3ObjectSignedUrlData {
//     Bucket: string,
//     Key: string,
//     ContentType?: string,
//     ACL?: string,
//     Metadata?: any,
//     Tags?: any,
//     Expires?: number,
// };

// export class AwsS3 {
//     constructor() {}

//     putObject(params: {Bucket: string, Key: string, Body: any}): Promise<any> {
//         return new Promise((resolve, reject) => {
//             if (params.Body.type === 'Buffer') {
//                 console.log('Buffer');
//                 params.Body = Buffer.from(params.Body.data);
//             }
//             console.log(path.resolve(__dirname, S3_FOLDER, params.Bucket, params.Key));
//             FileUtils.writeFileInItsFolder(path.resolve(__dirname, S3_FOLDER, params.Bucket, params.Key), params.Body)
//                 .then((error: any) => {
//                     console.log('wrote it');
                    
//                     if (error) {
//                         reject(error);
//                     } else {
//                         resolve();
//                     }
//                 })
//                 .catch((error) => {
//                     console.log('did not write it');
//                     reject(error);
//                 });
//         });
//     };
//     deleteObject(params: any): Promise<any> {
//         return new Promise((resolve, reject) => {
//             FileUtils.deleteFileSync(path.resolve(__dirname, S3_FOLDER, params.Bucket, params.Key));
//             resolve();
//         });
//     };
//     getObject(body: {
//         Bucket: string,
//         Key: string
//     }): Promise<{Body: any}> {
//         return new Promise((resolve, reject) => {
//             fs.readFile(path.resolve(__dirname, S3_FOLDER, body.Bucket, body.Key), (error, data) => {
//                 if (error) {
//                     reject(error);
//                 } else {
//                     resolve({
//                         Body: Buffer.from(data).toString()
//                     });
//                 }
//             });
//         });
//     }
//     getSignedUrl(action: S3SignedUrlType, data: S3ObjectSignedUrlData, postgresUtils: PostgresUtils): Promise<any> {
//         // TODO : Dockerize
//         console.log('This part of the code works on a nodejs env only so far. To be dockerized');
        
//         return new Promise((resolve, reject) => {
//             if (action === 'putObject') {
//                 postgresUtils.executeFunction('mgtf_insert_s3_object', [
//                     data.Bucket,
//                     data.Key,
//                     data.ContentType,
//                     data.ACL,
//                     data.Metadata,
//                     data.Tags
//                 ])
//                     .then((newId: { mgtf_insert_s3_object: number}[]) => {                        
//                         resolve({
//                             uploadURL:'http://localhost:65065/s3/uploadObject/' + newId[0].mgtf_insert_s3_object,
//                             headers: [{
//                                 key: "Access-Control-Allow-Origin", value: "*"
//                             },{
//                                 key: "Access-Control-Allow-Headers", value: "Origin, X-Requested-With, Content-Type, Accept, x-amz-acl"
//                             },{
//                                 key: "Access-Control-Allow-Methods", value: "GET,HEAD,OPTIONS,POST,PUT",
//                             }]
//                         });
//                     })
//                     .catch(reject);
//             } else {
//                 resolve('file://' + path.resolve(__dirname, S3_FOLDER, data.Bucket, data.Key));
//             }
//         });
//     }
// }