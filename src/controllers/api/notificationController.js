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
exports.delete_all_notification = exports.delete_notification = exports.send_notification_on_call = exports.get_review_notfication = exports.get_spark_notfication = exports.get_like_notfication = exports.get_match_notfication = exports.get_user_notification = void 0;
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../../entities/User");
const typeorm_1 = require("typeorm");
const Notification_1 = require("../../entities/Notification");
const responseHandler_1 = require("../../utils/responseHandler");
const Chat_1 = require("../../entities/Chat");
const CallLogs_1 = require("../../entities/CallLogs");
const firebaseUser_1 = require("../../notificaion/firebaseUser");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const get_user_notification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const excludedTitles = [
            "Your documents have been approved by the admin",
            "Your documents have been rejected by the admin"
        ];
        const notificationRepository = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const ChatRepo = (0, typeorm_1.getRepository)(Chat_1.Chat);
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const notifications = yield notificationRepository.find({
            where: {
                recipient: { user_id },
                notification_type: (0, typeorm_1.Not)("app_feedback"),
                notificaton_title: (0, typeorm_1.Not)((0, typeorm_1.In)(excludedTitles)),
            },
            relations: ["recipient", "sender"],
            order: { created_at: "DESC" }
        });
        if (!notifications) {
            return (0, responseHandler_1.handleError)(res, 404, "Notification Not Found");
        }
        const notificationsWithChat = yield Promise.all(notifications.map((notification) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (((_a = notification.sender) === null || _a === void 0 ? void 0 : _a.profile_image) && !notification.sender.profile_image.startsWith("http")) {
                notification.sender.profile_image = `${APP_URL}${notification.sender.profile_image}`;
            }
            if (((_b = notification.recipient) === null || _b === void 0 ? void 0 : _b.profile_image) && !notification.recipient.profile_image.startsWith("http")) {
                notification.recipient.profile_image = `${APP_URL}${notification.recipient.profile_image}`;
            }
            const chat = yield ChatRepo.findOne({
                where: [
                    { user_1: { user_id: user_id }, user_2: { user_id: (_c = notification.sender) === null || _c === void 0 ? void 0 : _c.user_id } },
                    { user_1: { user_id: (_d = notification.sender) === null || _d === void 0 ? void 0 : _d.user_id }, user_2: { user_id: user_id } }
                ]
            });
            let has_chat = chat ? true : false;
            return Object.assign(Object.assign({}, notification), { has_chat });
        })));
        yield notificationRepository.update({ recipient: { user_id: user_id } }, { is_user_notification_read: true });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Notification retrieved successfully", notificationsWithChat);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_user_notification = get_user_notification;
const get_match_notfication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            return (0, responseHandler_1.handleError)(res, 400, "User ID is required.");
        }
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const ChatRepo = (0, typeorm_1.getRepository)(Chat_1.Chat);
        const notifications = yield NotificationRepo.find({
            where: {
                recipient: { user_id },
                notification_type: 'match',
            },
            relations: ['recipient', 'sender'],
            order: { created_at: "DESC" }
        });
        if (notifications.length === 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "Match Notification Retrieved Successfully.", []);
        }
        const notificationsWithChat = yield Promise.all(notifications.map((notification) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (((_a = notification.sender) === null || _a === void 0 ? void 0 : _a.profile_image) && !notification.sender.profile_image.startsWith("http")) {
                notification.sender.profile_image = `${APP_URL}${notification.sender.profile_image}`;
            }
            if (((_b = notification.recipient) === null || _b === void 0 ? void 0 : _b.profile_image) && !notification.recipient.profile_image.startsWith("http")) {
                notification.recipient.profile_image = `${APP_URL}${notification.recipient.profile_image}`;
            }
            const chat = yield ChatRepo.findOne({
                where: [
                    { user_1: { user_id: user_id }, user_2: { user_id: (_c = notification.sender) === null || _c === void 0 ? void 0 : _c.user_id } },
                    { user_1: { user_id: (_d = notification.sender) === null || _d === void 0 ? void 0 : _d.user_id }, user_2: { user_id: user_id } }
                ]
            });
            let has_chat = chat ? true : false;
            return Object.assign(Object.assign({}, notification), { has_chat });
        })));
        return (0, responseHandler_1.handleSuccess)(res, 200, "Match Notification Retrieved Successfully.", notificationsWithChat);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.get_match_notfication = get_match_notfication;
const get_like_notfication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            return (0, responseHandler_1.handleError)(res, 400, "User ID is required.");
        }
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const notifications = yield NotificationRepo.find({
            where: {
                recipient: { user_id },
                notification_type: 'like',
            },
            relations: ['recipient', 'sender'],
            order: { created_at: "DESC" }
        });
        if (notifications.length === 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "Like Notification Retrieved Successfully.", []);
        }
        notifications.forEach((notification) => {
            var _a, _b;
            if (((_a = notification.sender) === null || _a === void 0 ? void 0 : _a.profile_image) && !notification.sender.profile_image.startsWith("http")) {
                notification.sender.profile_image = `${APP_URL}${notification.sender.profile_image}`;
            }
            if (((_b = notification.recipient) === null || _b === void 0 ? void 0 : _b.profile_image) && !notification.recipient.profile_image.startsWith("http")) {
                notification.recipient.profile_image = `${APP_URL}${notification.recipient.profile_image}`;
            }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Like Notification Retrieved Successfully.", notifications);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.get_like_notfication = get_like_notfication;
const get_spark_notfication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            return (0, responseHandler_1.handleError)(res, 400, "User ID is required.");
        }
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const notifications = yield NotificationRepo.find({
            where: {
                recipient: { user_id },
                notification_type: 'spark',
            },
            relations: ['recipient', 'sender'],
            order: { created_at: "DESC" }
        });
        if (notifications.length === 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "Spark Notification Retrieved Successfully.", []);
        }
        notifications.forEach((notification) => {
            var _a, _b;
            if (((_a = notification.sender) === null || _a === void 0 ? void 0 : _a.profile_image) && !notification.sender.profile_image.startsWith("http")) {
                notification.sender.profile_image = `${APP_URL}${notification.sender.profile_image}`;
            }
            if (((_b = notification.recipient) === null || _b === void 0 ? void 0 : _b.profile_image) && !notification.recipient.profile_image.startsWith("http")) {
                notification.recipient.profile_image = `${APP_URL}${notification.recipient.profile_image}`;
            }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Spark Notification Retrieved Successfully.", notifications);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.get_spark_notfication = get_spark_notfication;
const get_review_notfication = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            return (0, responseHandler_1.handleError)(res, 400, "User ID is required.");
        }
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const notifications = yield NotificationRepo.find({
            where: {
                recipient: { user_id },
                notification_type: 'review',
            },
            relations: ['recipient', 'sender'],
            order: { created_at: "DESC" }
        });
        if (notifications.length === 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "Spark Notification Retrieved Successfully.", []);
        }
        notifications.forEach((notification) => {
            var _a, _b;
            if (((_a = notification.sender) === null || _a === void 0 ? void 0 : _a.profile_image) && !notification.sender.profile_image.startsWith("http")) {
                notification.sender.profile_image = `${APP_URL}${notification.sender.profile_image}`;
            }
            if (((_b = notification.recipient) === null || _b === void 0 ? void 0 : _b.profile_image) && !notification.recipient.profile_image.startsWith("http")) {
                notification.recipient.profile_image = `${APP_URL}${notification.recipient.profile_image}`;
            }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Review Notification Retrieved Successfully.", notifications);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.get_review_notfication = get_review_notfication;
const send_notification_on_call = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const callLogSchema = joi_1.default.object({
            receiver_id: joi_1.default.number().required()
        });
        const { error, value } = callLogSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { receiver_id } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const callLogsRepo = (0, typeorm_1.getRepository)(CallLogs_1.CallLogs);
        const user = yield userRepository.findOne({ where: { user_id: user_id } });
        const receiver = yield userRepository.findOne({ where: { user_id: receiver_id } });
        if (!receiver) {
            return (0, responseHandler_1.handleError)(res, 404, "User not found.");
        }
        const fcm_token = receiver.fcm_token;
        if (!fcm_token) {
            return (0, responseHandler_1.handleError)(res, 404, "FCM token not found.");
        }
        let notification_title = `${user === null || user === void 0 ? void 0 : user.full_name}`;
        let notification_message = 'You have a new call!';
        if (!receiver.is_online) {
            yield (0, firebaseUser_1.sendNotificationUser)(receiver.fcm_token, notification_title, notification_message, {
                type: 'call',
            });
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Notification sent successfully.");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.send_notification_on_call = send_notification_on_call;
const delete_notification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            notification_id: joi_1.default.number().required()
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { notification_id } = value;
        const notificationRepository = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const notification = yield notificationRepository.findOne({ where: { notification_id: Number(notification_id) } });
        if (!notification) {
            return (0, responseHandler_1.handleError)(res, 404, "Notification not found.");
        }
        yield notificationRepository.remove(notification);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Notification deleted successfully.");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.delete_notification = delete_notification;
const delete_all_notification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const notificationRepository = (0, typeorm_1.getRepository)(Notification_1.Notification);
        yield notificationRepository.delete({ recipient: { user_id } });
        return (0, responseHandler_1.handleSuccess)(res, 200, "All notifications deleted successfully.");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.delete_all_notification = delete_all_notification;
