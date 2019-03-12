'use strict';
const CommonUtils = require('../utils/CommonUtils');
const functions = require('./fucntions').functions;

module.exports.runfunction = (event, context, callback) => {
    CommonUtils.checkWarmup(event, callback, () => {
        let f;
        if (event.functionName) {
            f = functions[event.functionName];
        }

        if (!f) {
            CommonUtils.errorCallback(callback, 'Function not found', 'Function not found');
        } else {
            if (f.readOnly) {
                CommonUtils.postgresFunctionReadOnly(
                    event,
                    context,
                    callback,
                    f.dbName,
                    f.fields,
                    `Operation ${f.operationName} successfull.`,
                    `Operation ${f.operationName} failed.`
                );
            } else {
                CommonUtils.postgresFunction(
                    event,
                    context,
                    callback,
                    f.dbName,
                    f.fields,
                    `Operation ${f.operationName} successfull.`,
                    `Operation ${f.operationName} failed.`
                );
            }
        }
    })
};