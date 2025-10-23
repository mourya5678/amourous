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
exports.get_stuff_list_user = exports.send_stuff_to_user = void 0;
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../../entities/User");
const typeorm_1 = require("typeorm");
const Notification_1 = require("../../entities/Notification");
const ProfileStuff_1 = require("../../entities/ProfileStuff");
const firebaseUser_1 = require("../../notificaion/firebaseUser");
const responseHandler_1 = require("../../utils/responseHandler");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const send_stuff_to_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let send_stuff_to_user_schema = joi_1.default.object({
            recipient_id: joi_1.default.number().required(),
            stuff_name: joi_1.default.string().valid("kiss", "chocolate", "love", "flower", "flirty").required(),
        });
        const { error, value } = send_stuff_to_user_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { recipient_id, stuff_name } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const ProfileStuffRepo = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const user_data = yield userRepository.findOne({ where: { user_id: recipient_id } });
        if (!user_data)
            return (0, responseHandler_1.handleError)(res, 404, "Recipient User Not Found");
        const stuff_data = yield ProfileStuffRepo.findOne({ where: { recipient: { user_id: recipient_id }, sender: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id } } });
        if (!stuff_data) {
            const newStuff = ProfileStuffRepo.create({
                stuff_name: stuff_name,
                recipient: user_data,
                sender: req.user
            });
            yield ProfileStuffRepo.save(newStuff);
        }
        else {
            if (stuff_name)
                stuff_data.stuff_name = stuff_name;
            yield ProfileStuffRepo.save(stuff_data);
        }
        let notification_title = `${(_b = req.user) === null || _b === void 0 ? void 0 : _b.full_name}`;
        let notification_message = `You Have new ${stuff_name} stuff`;
        if (user_data.is_push_notification_on) {
            yield (0, firebaseUser_1.sendNotificationUser)(user_data.fcm_token, notification_title, notification_message, {});
        }
        // let newNotification = NotificationRepo.create({
        //     recipient: user_data,
        //     notification_type: "stuff",
        //     sender: req.user,
        //     notificaton_title: notification_title,
        //     notification_message: notification_message,
        // })
        // await NotificationRepo.save(newNotification);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Stuff sent successfully.");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.send_stuff_to_user = send_stuff_to_user;
const get_stuff_list_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let send_stuff_to_user_schema = joi_1.default.object({
            user_id: joi_1.default.number().required(),
        });
        const { error, value } = send_stuff_to_user_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { user_id } = value;
        const ProfileStuffRepo = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        let request_list = yield ProfileStuffRepo.find({
            where: { recipient: { user_id }, }
        });
        if (request_list.length === 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "Request List Retrieved Successfully", {});
        }
        let stuffCount = {};
        request_list.forEach((request) => {
            const { stuff_name } = request;
            if (stuff_name) {
                stuffCount[stuff_name] = (stuffCount[stuff_name] || 0) + 1;
            }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Request List Retrieved Successfully", stuffCount);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.get_stuff_list_user = get_stuff_list_user;
