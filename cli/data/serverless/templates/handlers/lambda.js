'use strict';
const CommonUtils = require('../utils/CommonUtils');
module.exports.<function_name> = (event, context, callback) => {
    CommonUtils.process<read_only>(
        event,
        context,
        callback,
        '<db_function_name>',
        [<db_camel_cased_parameters>],
        'Operation <function_description> successfull.',
        'Operation <function_description> failed.'
    );
};