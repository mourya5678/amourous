"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joiErrorHandle = exports.handleSuccess = exports.handleError = void 0;
const handleError = (res, statusCode, message) => {
    return res.status(statusCode).send({
        success: false,
        status: statusCode,
        message: message
    });
};
exports.handleError = handleError;
const handleSuccess = (res, statusCode, message, ...data) => {
    return res.status(statusCode).json({
        success: true,
        status: statusCode,
        message: message,
        data: data.length > 0 ? data[0] : undefined,
    });
};
exports.handleSuccess = handleSuccess;
const joiErrorHandle = (res, error) => {
    return res.status(400).send({
        success: false,
        status: 400,
        message: error.details[0].message
    });
};
exports.joiErrorHandle = joiErrorHandle;
