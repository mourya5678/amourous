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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCallLog = exports.getCallLogs = exports.createCallLog = void 0;
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../../entities/User");
const typeorm_1 = require("typeorm");
const responseHandler_1 = require("../../utils/responseHandler");
const CallLogs_1 = require("../../entities/CallLogs");
const socket_1 = require("../../utils/socket");
const app_1 = require("../../../app");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const createCallLog = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const callLogSchema = joi_1.default.object({
            call_id: joi_1.default.string().required(),
            receiver_id: joi_1.default.number().optional().allow("", null),
            type: joi_1.default.string().valid('audio', 'video').optional().allow("", null),
            startedAt: joi_1.default.date().optional().allow("", null),
            status: joi_1.default.string().valid('missed', 'rejected', 'completed').optional().allow("", null),
        });
        const { error, value } = callLogSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        let { call_id, receiver_id, type, startedAt, status } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const callLogsRepo = (0, typeorm_1.getRepository)(CallLogs_1.CallLogs);
        let existingCallLog = yield callLogsRepo.findOne({ where: { call_id }, relations: ['receiver'] });
        if (!receiver_id) {
            receiver_id = (_a = existingCallLog === null || existingCallLog === void 0 ? void 0 : existingCallLog.receiver) === null || _a === void 0 ? void 0 : _a.user_id;
        }
        const receiver = yield userRepository.findOne({ where: { user_id: receiver_id } });
        if (!receiver)
            return (0, responseHandler_1.handleError)(res, 404, "Receiver not found");
        if (!existingCallLog) {
            existingCallLog = callLogsRepo.create({
                caller: req.user,
                receiver: receiver,
                type,
                startedAt,
                status,
                duration: 0,
                call_id
            });
        }
        else {
            if (type)
                existingCallLog.type = type;
            if (startedAt)
                existingCallLog.startedAt = startedAt;
            if (status)
                existingCallLog.status = status;
        }
        yield callLogsRepo.save(existingCallLog);
        if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id) && receiver_id) {
            yield (0, socket_1.handleBlockUnblockUserStatus)(app_1.io)({ user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id, target_user_id: receiver_id });
        }
        return (0, responseHandler_1.handleSuccess)(res, 201, "Call log created successfully", existingCallLog);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.createCallLog = createCallLog;
const getCallLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const callLogsRepo = (0, typeorm_1.getRepository)(CallLogs_1.CallLogs);
        const callLogs = yield callLogsRepo.find({
            where: [
                { caller: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id } },
                { receiver: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id } }
            ],
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
    var _a;
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
        if (existingCallLog.caller.user_id !== ((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id)) {
            return (0, responseHandler_1.handleError)(res, 403, "You don't have permission to delete this call log");
        }
        yield callLogsRepo.remove(existingCallLog);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Call log deleted successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.deleteCallLog = deleteCallLog;
