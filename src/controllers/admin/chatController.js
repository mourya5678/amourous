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
exports.get_all_reported_messages = void 0;
const responseHandler_1 = require("../../utils/responseHandler");
const responseHandler_2 = require("../../utils/responseHandler");
const MessageReport_1 = require("../../entities/MessageReport");
const typeorm_1 = require("typeorm");
const get_all_reported_messages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const messageReportRepository = (0, typeorm_1.getRepository)(MessageReport_1.MessageReport);
        const messageReports = yield messageReportRepository.find({ relations: ["sender", "user"], order: { created_at: "DESC" } });
        return (0, responseHandler_1.handleSuccess)(res, 200, "All reported messages fetched successfully", messageReports);
    }
    catch (error) {
        return (0, responseHandler_2.handleError)(res, 500, error.message);
    }
});
exports.get_all_reported_messages = get_all_reported_messages;
