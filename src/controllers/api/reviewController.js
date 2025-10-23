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
exports.get_all_app_review = exports.send_app_review = exports.get_all_review = exports.send_review = void 0;
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../../entities/User");
const typeorm_1 = require("typeorm");
const Notification_1 = require("../../entities/Notification");
const ProfileStuff_1 = require("../../entities/ProfileStuff");
const firebaseUser_1 = require("../../notificaion/firebaseUser");
const responseHandler_1 = require("../../utils/responseHandler");
const Review_1 = require("../../entities/Review");
const AppReview_1 = require("../../entities/AppReview");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const send_review = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let schema = joi_1.default.object({
            recipient_id: joi_1.default.number().required(),
            rating: joi_1.default.number().required(),
            message: joi_1.default.string().optional().allow("", null),
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { recipient_id, rating, message } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const ProfileStuffRepo = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const ReviewRepo = (0, typeorm_1.getRepository)(Review_1.Review);
        const user_data = yield userRepository.findOne({ where: { user_id: recipient_id } });
        if (!user_data)
            return (0, responseHandler_1.handleError)(res, 404, "Recipient User Not Found");
        const review_data = yield ReviewRepo.findOne({ where: { recipient: { user_id: recipient_id }, sender: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id } } });
        if (!review_data) {
            const newReview = ReviewRepo.create({
                rating: rating,
                recipient: user_data,
                sender: req.user,
                message: message
            });
            yield ReviewRepo.save(newReview);
        }
        else {
            return (0, responseHandler_1.handleError)(res, 400, "You Have Already Reviewed This User");
        }
        let notification_title = `${(_b = req.user) === null || _b === void 0 ? void 0 : _b.full_name}`;
        let notification_message = `You Have new Review`;
        if (user_data.is_push_notification_on) {
            let data = {
                notification_type: 'review',
                user_id: String(recipient_id),
            };
            yield (0, firebaseUser_1.sendNotificationUser)(user_data.fcm_token, notification_title, notification_message, data);
        }
        let newNotification = NotificationRepo.create({
            recipient: user_data,
            notification_type: "review",
            sender: req.user,
            notificaton_title: notification_title,
            notification_message: notification_message,
        });
        yield NotificationRepo.save(newNotification);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Review sent successfully.");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.send_review = send_review;
const get_all_review = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            user_id: joi_1.default.number().optional().allow("", null),
        });
        const { error, value } = schema.validate(req.query);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const userRepo = (0, typeorm_1.getRepository)(User_1.User);
        const ReviewRepo = (0, typeorm_1.getRepository)(Review_1.Review);
        const { user_id } = value;
        let targetUser;
        if (user_id) {
            targetUser = yield userRepo.findOne({ where: { user_id } });
            if (!targetUser)
                return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        }
        else {
            targetUser = req.user;
        }
        if (!targetUser)
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        const review_list = yield ReviewRepo.find({
            where: { recipient: { user_id: targetUser.user_id } },
            order: { created_at: "DESC" },
            relations: ["sender", "recipient"],
        });
        const review_list_not = {
            review_list: [],
            review_count: 0,
            average_rating: 0,
            profile_image: targetUser.profile_image,
            full_name: targetUser.full_name
        };
        if (review_list.length === 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "Review List Retrieved Successfully", review_list_not);
        }
        const review_count = review_list.length;
        const total_rating = review_list.reduce((sum, review) => sum + (review.rating || 0), 0);
        const average_rating = review_count > 0 ? total_rating / review_count : 0;
        const final_data = {
            review_list,
            review_count,
            average_rating: Number(average_rating.toFixed(2)),
            profile_image: targetUser.profile_image,
            full_name: targetUser.full_name
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "Review List Retrieved Successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_all_review = get_all_review;
//===================================== App Review ====================================
const send_app_review = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let schema = joi_1.default.object({
            rating: joi_1.default.number().required(),
            message: joi_1.default.string().optional().allow(null, ""),
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { rating, message } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const ProfileStuffRepo = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const ReviewRepo = (0, typeorm_1.getRepository)(AppReview_1.AppReview);
        const review_data = yield ReviewRepo.findOne({ where: { sender: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id } } });
        if (!review_data) {
            const newReview = ReviewRepo.create({
                rating: rating,
                sender: req.user,
                message: message
            });
            yield ReviewRepo.save(newReview);
        }
        else {
            return (0, responseHandler_1.handleError)(res, 400, "You Have Already Reviewed");
        }
        let notification_title = `${(_b = req.user) === null || _b === void 0 ? void 0 : _b.full_name}`;
        let notification_message = `New App Feedback`;
        let newNotification = NotificationRepo.create({
            recipient: req.user,
            notification_type: "app_feedback",
            sender: req.user,
            notificaton_title: notification_title,
            notification_message: notification_message,
        });
        yield NotificationRepo.save(newNotification);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Feedback sent successfully.");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.send_app_review = send_app_review;
const get_all_app_review = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let sechema = joi_1.default.object({
            user_id: joi_1.default.number().required(),
        });
        const { error, value } = sechema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { user_id } = value;
        const ProfileStuffRepo = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        const ReviewRepo = (0, typeorm_1.getRepository)(AppReview_1.AppReview);
        let review_list = yield ReviewRepo.find({
            order: { created_at: "DESC" },
            relations: ["sender"],
        });
        if (review_list.length === 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "Review List Retrieved Successfully", []);
        }
        let review_count = review_list.length;
        const total_rating = review_list.reduce((sum, review) => sum + (review.rating || 0), 0);
        const average_rating = review_count > 0 ? total_rating / review_count : 0;
        let final_data = {
            review_list,
            review_count,
            average_rating: Number(average_rating.toFixed(2)),
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "Feedback List Retrieved Successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_all_app_review = get_all_app_review;
