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
exports.is_first_game = exports.report_message = exports.get_unread_users_count = exports.upload_media_files = exports.get_message_by_users = exports.get_message_by_chat = void 0;
const joi_1 = __importDefault(require("joi"));
const typeorm_1 = require("typeorm");
const responseHandler_1 = require("../../utils/responseHandler");
const Message_1 = require("../../entities/Message");
const MessageReport_1 = require("../../entities/MessageReport");
const Poll_1 = require("../../entities/Poll");
const get_message_by_chat = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const message_schema = joi_1.default.object({
        chat_id: joi_1.default.number().required(),
    });
    const { error, value } = message_schema.validate(req.body);
    if (error)
        return (0, responseHandler_1.joiErrorHandle)(res, error);
    const { chat_id } = value;
    try {
        const messagesRepository = (0, typeorm_1.getRepository)(Message_1.Message);
        const messages = yield messagesRepository.find({ where: { chat: { chat_id: chat_id } }, relations: ["chat", "chat.user_1", "chat.user_2", "sender"] });
        if (!messages) {
            return (0, responseHandler_1.handleError)(res, 404, "Chat Not Found");
        }
        let data = [];
        messages.map((message) => __awaiter(void 0, void 0, void 0, function* () {
            let newData = {
                user_1_id: message.chat.user_1.user_id,
                user_2_id: message.chat.user_2.user_id,
                sender_id: message.sender.user_id,
                content: message.content,
                created_at: message.created_at
            };
            data.push(newData);
            message.is_read = true;
            yield messagesRepository.save(message);
        }));
        return (0, responseHandler_1.handleSuccess)(res, 200, "Chat Messages Retrived Successfully", data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_message_by_chat = get_message_by_chat;
const get_message_by_users = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = req.user;
    const message_schema = joi_1.default.object({
        user_2_id: joi_1.default.number().required(),
    });
    const { error, value } = message_schema.validate(req.body);
    if (error)
        return (0, responseHandler_1.joiErrorHandle)(res, error);
    const { user_2_id } = value;
    let user_1_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
    try {
        const messagesRepository = (0, typeorm_1.getRepository)(Message_1.Message);
        const messages = yield messagesRepository.find({
            where: [
                { chat: { user_1: { user_id: user_1_id }, user_2: { user_id: user_2_id } } },
                { chat: { user_1: { user_id: user_2_id }, user_2: { user_id: user_1_id } } }
            ],
            relations: ["chat", "chat.user_1", "chat.user_2", "sender"]
        });
        if (!messages || messages.length === 0) {
            return (0, responseHandler_1.handleError)(res, 404, "Chat Not Found");
        }
        let data = [];
        for (const message of messages) {
            if (!message.chat || !message.chat.user_1 || !message.chat.user_2 || !message.sender) {
                console.warn("Incomplete message relation found", message);
                continue;
            }
            data.push({
                message_id: message.message_id,
                user_1_id: message.chat.user_1.user_id,
                user_2_id: message.chat.user_2.user_id,
                sender_id: message.sender.user_id,
                content: message.content,
                is_read: message.is_read,
                created_at: message.created_at
            });
            message.is_read = true;
            yield messagesRepository.save(message);
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Chat Messages Retrieved Successfully", data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_message_by_users = get_message_by_users;
const upload_media_files = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_req = req.user;
        if (!Array.isArray(req.files) || req.files.length === 0) {
            return (0, responseHandler_1.handleError)(res, 400, "No files provided");
        }
        const newPhotos = req.files.map((file) => ({
            user: user_req,
            image: file.location,
        }));
        const imageUrls = newPhotos.map((photo) => photo.image);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Media Files uploaded successfully", imageUrls);
    }
    catch (error) {
        console.error("Upload error:", error);
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.upload_media_files = upload_media_files;
const get_unread_users_count = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
    try {
        const messagesRepository = (0, typeorm_1.getRepository)(Message_1.Message);
        const unreadMessages = yield messagesRepository.find({
            where: {
                is_read: false,
                chat: [
                    { user_1: { user_id }, user_2: (0, typeorm_1.Not)(user_id) },
                    { user_2: { user_id }, user_1: (0, typeorm_1.Not)(user_id) }
                ],
            },
            relations: ["chat", "chat.user_1", "chat.user_2", "sender"]
        });
        const sendersSet = new Set();
        for (const msg of unreadMessages) {
            if (!msg.sender || msg.sender.user_id === user_id)
                continue;
            sendersSet.add(msg.sender.user_id);
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Unread user count fetched", { unread_user_count: sendersSet.size });
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_unread_users_count = get_unread_users_count;
const report_message = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const message_schema = joi_1.default.object({
        message_id: joi_1.default.number().required(),
        sender_id: joi_1.default.number().required()
    });
    const { error, value } = message_schema.validate(req.body);
    if (error)
        return (0, responseHandler_1.joiErrorHandle)(res, error);
    const { message_id, sender_id } = value;
    try {
        const messageReportRepository = (0, typeorm_1.getRepository)(MessageReport_1.MessageReport);
        const messageRepository = (0, typeorm_1.getRepository)(Message_1.Message);
        const message = yield messageRepository.findOne({ where: { message_id: message_id } });
        if (!message)
            return (0, responseHandler_1.handleError)(res, 404, "Message not found");
        const messageReport = messageReportRepository.create({
            sender: { user_id: sender_id },
            user: user,
            content: message.content,
            file_url: message.file_url,
            message_type: message.message_type
        });
        yield messageReportRepository.save(messageReport);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Message reported successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.report_message = report_message;
const is_first_game = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const poll_schema = joi_1.default.object({
            recipient_id: joi_1.default.number().required()
        });
        const { error, value } = poll_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { recipient_id } = value;
        const pollRepository = (0, typeorm_1.getRepository)(Poll_1.Poll);
        const messageRepository = (0, typeorm_1.getRepository)(Message_1.Message);
        const message = yield messageRepository.findOne({
            where: [
                {
                    chat: {
                        user_1: { user_id: user === null || user === void 0 ? void 0 : user.user_id },
                        user_2: { user_id: recipient_id }
                    },
                    message_type: "poll"
                },
                {
                    chat: {
                        user_1: { user_id: recipient_id },
                        user_2: { user_id: user === null || user === void 0 ? void 0 : user.user_id }
                    },
                    message_type: "poll"
                }
            ]
        });
        if (!message) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "First poll game", { is_first_game: true });
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Not first poll game", { is_first_game: false });
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.is_first_game = is_first_game;
