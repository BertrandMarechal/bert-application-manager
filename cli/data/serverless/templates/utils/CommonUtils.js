const pgp = require('pg-promise')();
var db;
var connections = {};

function CommonUtils() {
}

function connect(connectionString) {
    if (connections[connectionString]) {
        db = connections[connectionString];
    } else {
        connections[connectionString] = pgp(connectionString);
        db = connections[connectionString];
    }
}

module.exports = CommonUtils;

function _process(event,
                  context,
                  callback,
                  functionName,
                  fieldsToPass,
                  successMessage,
                  errorMessage,
                  customCallback,
                  customErrorCallback) {
    if (event.wu) {
        callback(null, 'Warmed up');
        return console.log('Warmed up');
    }

    var params = [context ? (context.identity ? context.identity.cognitoIdentityId : null) : null];
    for (var i = 0; i < fieldsToPass.length; i++) {
        params.push(event[fieldsToPass[i]]);
    }
    console.log(functionName, params);
    db.func(functionName, params)
        .then(data => {
            pgp.end();
            console.log('result: ' + JSON.stringify(data));
            if (data instanceof Array) {
                if (data.length === 0) {
                    data = null;
                } else if (data[0].hasOwnProperty(functionName)) {
                    data = data[0][functionName];
                }

            }
            if (customCallback) {
                customCallback(data);
            }
            else {
                callback(null, {
                    success: true,
                    message: successMessage,
                    data: data
                });
            }
        })
        .catch(error => {
            pgp.end();
            console.log('ERROR:', error); // print the error;
            if (customErrorCallback) {
                customErrorCallback(error.message || error);
            }
            else {
                callback(null, {
                    success: false,
                    message: errorMessage,
                    error: error.message || error
                });
            }
        });

}

module.exports.postgresFunctionReadOnly = function (event,
                                           context,
                                           callback,
                                           functionName,
                                           fieldsToPass,
                                           successMessage,
                                           errorMessage,
                                           customCallback,
                                           customErrorCallback) {
    connect(process.env.pgConnStrRo);
    _process(event,context,callback,functionName,fieldsToPass,successMessage,errorMessage,customCallback,customErrorCallback);

};
module.exports.postgresFunction = function (event,
                                   context,
                                   callback,
                                   functionName,
                                   fieldsToPass,
                                   successMessage,
                                   errorMessage,
                                   customCallback,
                                   customErrorCallback) {
    connect(process.env.pgConnStr);
    _process(event,context,callback,functionName,fieldsToPass,successMessage,errorMessage,customCallback,customErrorCallback);
};
module.exports.successCallback = function (
    callback,
    successMessage,
    data) {
    callback(null, {
        success: true,
        message: successMessage,
        data: data,
        body: JSON.stringify({
            success: true,
            message: successMessage,
            data: data
        })
    });
};
module.exports.errorCallback = function (
    callback,
    errorMessage,
    error) {
    callback(null, {
        success: false,
        message: errorMessage,
        error: error.message || error
    });
};

module.exports.checkWarmup = function (event,
    callback,
    curtomCallback) {
if (event.wu) {
callback(null, 'Warmed up');
return console.log('Warmed up');
} else {
curtomCallback();
}
};