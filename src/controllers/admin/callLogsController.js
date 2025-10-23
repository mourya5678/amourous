"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCallLog = exports.getCallLogs = void 0;
const typeorm_1 = require("typeorm");
const responseHandler_1 = require("../../utils/responseHandler");
const CallLogs_1 = require("../../entities/CallLogs");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const getCallLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const callLogsRepo = (0, typeorm_1.getRepository)(CallLogs_1.CallLogs);
        const callLogs = yield callLogsRepo.find({
            relations: ['caller', 'receiver'],
            order: { created_at: 'DESC' }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Call logs fetched successfully", callLogs);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getCallLogs = getCallLogs;
const deleteCallLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const callLogsRepo = (0, typeorm_1.getRepository)(CallLogs_1.CallLogs);
        const existingCallLog = yield callLogsRepo.findOne({
            where: { call_logs_id: Number(id) },
            relations: ['caller', 'receiver']
        });
        if (!existingCallLog) {
            return (0, responseHandler_1.handleError)(res, 404, "Call log not found");
        }
        // if (existingCallLog.caller.user_id !== req.user?.user_id) {
        //     return handleError(res, 403, "You don't have permission to delete this call log");
        // }
        yield callLogsRepo.remove(existingCallLog);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Call log deleted successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.deleteCallLog = deleteCallLog;
