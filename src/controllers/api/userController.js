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
exports.remove_friend = exports.MyFavorites = exports.not_interested_user = exports.accept_reject_request = exports.getFriends = exports.get_request_list = exports.send_spark = exports.like_unlike_user = exports.send_friend_request = exports.get_user_by_id = exports.get_slider_user = exports.home_page_match_api = exports.find_your_match = void 0;
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../../entities/User");
const typeorm_1 = require("typeorm");
const UserReport_1 = require("../../entities/UserReport");
const function_1 = require("../../utils/function");
const BlockedUser_1 = require("../../entities/BlockedUser");
const ProfileImage_1 = require("../../entities/ProfileImage");
const ProfileStuff_1 = require("../../entities/ProfileStuff");
const Notification_1 = require("../../entities/Notification");
const FriendRequest_1 = require("../../entities/FriendRequest");
const firebaseUser_1 = require("../../notificaion/firebaseUser");
const responseHandler_1 = require("../../utils/responseHandler");
const UserLike_1 = require("../../entities/UserLike");
const Spark_1 = require("../../entities/Spark");
const NotInterested_1 = require("../../entities/NotInterested");
const UserSubcription_1 = require("../../entities/UserSubcription");
const UserDailyUsage_1 = require("../../entities/UserDailyUsage");
const PlanLimits_1 = require("../../entities/PlanLimits");
const ContactSupport_1 = require("../../entities/ContactSupport");
const UsersFace_1 = require("../../entities/UsersFace");
const Review_1 = require("../../entities/Review");


const UsersVerificationDocuments_1 = require("../../entities/UsersVerificationDocuments");

// --------------------------------------------AWS----------------------------------------------//
const aws_s3_1 = require("../../utils/aws.s3");
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();

// ----------------------------------------END----------------------------------------------------//

const { v4: uuidv4 } = require("uuid");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const find_your_match = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const userReportRepo = (0, typeorm_1.getRepository)(UserReport_1.UserReport);
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const friendRequestRepository = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const profileImagesRepository = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const ProfileStuffRepository = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        const blockedUserRepo = (0, typeorm_1.getRepository)(BlockedUser_1.BlockedUser);
        const UserLikeRequestRepo = (0, typeorm_1.getRepository)(UserLike_1.UserLike);
        const sparkRepo = (0, typeorm_1.getRepository)(Spark_1.Spark);
        const NotInterestedRepo = (0, typeorm_1.getRepository)(NotInterested_1.NotInterested);
        const ageRange = ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.looking_for_age_range) === null || _c === void 0 ? void 0 : _c.split("-").map(Number)) || [18, 50];
        const kmRange = ((_e = (_d = req.user) === null || _d === void 0 ? void 0 : _d.looking_for_km_range) === null || _e === void 0 ? void 0 : _e.split("-").map(Number)) || [0, 39];
        const looking_for = (_g = (_f = req.user) === null || _f === void 0 ? void 0 : _f.looking_for) !== null && _g !== void 0 ? _g : null;
        const user_reports = yield userReportRepo.find({ where: { user: { user_id } } });
        const own_personality_profile_percentage = user_reports.length
            ? (user_reports.reduce((sum, report) => sum + Number(report.percentage), 0) / user_reports.length).toFixed(2)
            : 0;
        const blockedUsers = yield blockedUserRepo.find({
            where: [
                { blocker: { user_id }, is_blocked: true },
                { blocked: { user_id }, is_blocked: true },
            ],
            relations: ["blocker", "blocked"]
        });
        const blockedUserIds = blockedUsers.map(bu => bu.blocker.user_id === user_id ? bu.blocked.user_id : bu.blocker.user_id);
        const NotInterestedUsers = yield NotInterestedRepo.find({
            where: [
                { not_interested_by: { user_id } },
            ],
            relations: ["not_interested_by", "not_interested_to"]
        });
        const NotInterestedUserIds = NotInterestedUsers.map(entry => entry.not_interested_to.user_id);
        const excludedUserIds = [...blockedUserIds, ...NotInterestedUserIds, user_id];
        const whereClause = {
            is_verified: true,
            is_active: true,
            is_complete_profile: true,
            is_test_completed: true,
            age: (0, typeorm_1.Between)(ageRange[0], ageRange[1]),
            user_id: (0, typeorm_1.Not)((0, typeorm_1.In)(excludedUserIds)),
            is_profile_private: false
        };
        if (looking_for && looking_for !== 'All') {
            whereClause.gender = looking_for;
        }
        const preferredUsers = yield userRepository.find({
            where: whereClause,
            order: { user_id: "DESC" }
        });
        const preferredUserIds = preferredUsers.map(u => u.user_id);
        const remainingUsers = yield userRepository.find({
            where: {
                is_verified: true,
                is_active: true,
                is_complete_profile: true,
                is_test_completed: true,
                user_id: (0, typeorm_1.Not)((0, typeorm_1.In)([...excludedUserIds, ...preferredUserIds])),
            },
            order: { user_id: "DESC" }
        });
        const users = [...preferredUsers];
        // const users = [...preferredUsers, ...remainingUsers];
        if (!users.length)
            return (0, responseHandler_1.handleSuccess)(res, 200, "Users Retrived Successfully", []);
        const latitude = (_h = req.user) === null || _h === void 0 ? void 0 : _h.latitude;
        const longitude = (_j = req.user) === null || _j === void 0 ? void 0 : _j.longitude;
        const final_data = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            let rawDistance = null;
            let distance = null;
            let is_within_km_range = true;
            if (user.latitude &&
                user.longitude &&
                latitude &&
                longitude &&
                (kmRange === null || kmRange === void 0 ? void 0 : kmRange.length) === 2) {
                rawDistance = (0, function_1.calculateDistance)(latitude, longitude, user.latitude, user.longitude);
                is_within_km_range =
                    (rawDistance >= kmRange[0] && rawDistance <= kmRange[1]);
                distance = rawDistance.toFixed(2) + " km";
            }
            if (!is_within_km_range)
                return;
            const user_report = (yield userReportRepo.find({ where: { user: { user_id: user.user_id } }, relations: ["user"] })) || [];
            let personality_profile_percentage = null;
            if (user_report.length != 0) {
                let user_report_count = user_report.length;
                let total_score = 0;
                yield Promise.all(user_report.map((report) => {
                    total_score += Number(report.percentage);
                }));
                personality_profile_percentage = (total_score / user_report_count).toFixed(2);
            }
            const user_reports = yield userReportRepo.find({ where: { user: { user_id: user.user_id } } });
            const friend_request = yield friendRequestRepository.findOne({ where: { recipient: { user_id: user.user_id }, requester: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id }, status: (0, typeorm_1.Not)('No_Action') } });
            let is_request_sent = false;
            if (friend_request) {
                is_request_sent = true;
            }
            const friend_data = yield friendRequestRepository.findOne({ where: { recipient: { user_id: user.user_id }, requester: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, status: 'Accepted' } });
            let is_friend = false;
            if (friend_data) {
                is_friend = true;
            }
            const like_data = yield UserLikeRequestRepo.findOne({ where: { like_by: { user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id }, like_to: { user_id: user.user_id } } });
            let is_liked = false;
            if (like_data) {
                is_liked = true;
            }
            const spark_data = yield sparkRepo.findOne({ where: { send_by: { user_id: (_d = req.user) === null || _d === void 0 ? void 0 : _d.user_id }, send_to: { user_id: user.user_id } } });
            let is_spark_sent = false;
            if (spark_data) {
                is_spark_sent = true;
            }
            const user_personality_profile_percentage = user_reports.length
                ? (user_reports.reduce((sum, report) => sum + Number(report.percentage), 0) / user_reports.length).toFixed(2)
                : 0;
            const match_percentage = Math.round((100 - Math.abs(Number(own_personality_profile_percentage) - Number(user_personality_profile_percentage))) * 100) / 100;
            let profile_images = yield profileImagesRepository.find({ where: { user: { user_id: user.user_id } } });
            let stuff = yield ProfileStuffRepository.find({ where: { recipient: { user_id: user === null || user === void 0 ? void 0 : user.user_id } } });
            let stuffCount = {
                kiss: 0,
                chocolate: 0,
                love: 0,
                flower: 0,
                flirty: 0
            };
            stuff.forEach(({ stuff_name }) => {
                if (stuff_name && stuffCount.hasOwnProperty(stuff_name)) {
                    stuffCount[stuff_name]++;
                }
            });
            profile_images = yield Promise.all(profile_images.map((profile_image) => __awaiter(void 0, void 0, void 0, function* () {
                if (profile_image.image && !profile_image.image.startsWith("http")) {
                    profile_image.image = `${APP_URL}${profile_image.image}`;
                }
                return Object.assign({}, profile_image);
            })));

            const reviewRepo = (0, typeorm_1.getRepository)(Review_1.Review);
            console.log('user', user);
            
            const recipientUserId = user.user_id;
            console.log('recipientUserId', recipientUserId);

            const avgRatingResult = yield reviewRepo
                .createQueryBuilder("review")
                .select("AVG(review.rating)", "avgRating")
                .where("review.recipientUserId = :recipientUserId", { recipientUserId })
                .getRawOne();

            console.log('avgRatingResult', avgRatingResult);

            const avgRating = parseFloat(avgRatingResult.avgRating) || 0;

            return Object.assign(Object.assign({}, user), {
                profile_image: user.profile_image && !user.profile_image.startsWith("http")
                    ? `${APP_URL}${user.profile_image}`
                    : user.profile_image, match_percentage: match_percentage || 0, profile_images, stuff: stuffCount, distance,
                is_request_sent,
                is_liked,
                is_spark_sent,
                is_friend,
                personality_profile_percentage,
                avgRating,
            });
        })));


        let filteredResults = final_data.filter(Boolean);
        // filteredResults.avgRating=avgRating
        return (0, responseHandler_1.handleSuccess)(res, 200, "Users Retrieved Successfully", filteredResults);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.find_your_match = find_your_match;
const home_page_match_api = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const userReportRepo = (0, typeorm_1.getRepository)(UserReport_1.UserReport);
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const friendRequestRepository = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const profileImagesRepository = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const ProfileStuffRepository = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        const blockedUserRepo = (0, typeorm_1.getRepository)(BlockedUser_1.BlockedUser);
        const UserLikeRequestRepo = (0, typeorm_1.getRepository)(UserLike_1.UserLike);
        const sparkRepo = (0, typeorm_1.getRepository)(Spark_1.Spark);
        const NotInterestedRepo = (0, typeorm_1.getRepository)(NotInterested_1.NotInterested);
        const ageRange = ((_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.looking_for_age_range) === null || _c === void 0 ? void 0 : _c.split("-").map(Number)) || [18, 50];
        const kmRange = ((_e = (_d = req.user) === null || _d === void 0 ? void 0 : _d.looking_for_km_range) === null || _e === void 0 ? void 0 : _e.split("-").map(Number)) || [0, 39];
        const looking_for = (_g = (_f = req.user) === null || _f === void 0 ? void 0 : _f.looking_for) !== null && _g !== void 0 ? _g : null;
        const user_reports = yield userReportRepo.find({ where: { user: { user_id } } });
        const own_personality_profile_percentage = user_reports.length
            ? (user_reports.reduce((sum, report) => sum + Number(report.percentage), 0) / user_reports.length).toFixed(2)
            : 0;
        const blockedUsers = yield blockedUserRepo.find({
            where: [
                { blocker: { user_id }, is_blocked: true },
                { blocked: { user_id }, is_blocked: true },
            ],
            relations: ["blocker", "blocked"]
        });
        const blockedUserIds = blockedUsers.map(bu => bu.blocker.user_id === user_id ? bu.blocked.user_id : bu.blocker.user_id);
        const NotInterestedUsers = yield NotInterestedRepo.find({
            where: [
                { not_interested_by: { user_id } },
            ],
            relations: ["not_interested_by", "not_interested_to"]
        });
        const NotInterestedUserIds = NotInterestedUsers.map(entry => entry.not_interested_to.user_id);
        const excludedUserIds = [...blockedUserIds, ...NotInterestedUserIds, user_id];
        const whereClause = {
            is_verified: true,
            is_active: true,
            is_complete_profile: true,
            is_test_completed: true,
            is_profile_private: false,
            age: (0, typeorm_1.Between)(ageRange[0], ageRange[1]),
            user_id: (0, typeorm_1.Not)((0, typeorm_1.In)(excludedUserIds))
        };
        if (looking_for !== null) {
            whereClause.gender = looking_for;
        }
        const preferredUsers = yield userRepository.find({
            where: whereClause,
            order: { user_id: "DESC" }
        });
        const preferredUserIds = preferredUsers.map(u => u.user_id);
        const remainingUsers = yield userRepository.find({
            where: {
                is_verified: true,
                is_active: true,
                is_complete_profile: true,
                is_test_completed: true,
                is_profile_private: false,
                user_id: (0, typeorm_1.Not)((0, typeorm_1.In)([...excludedUserIds, ...preferredUserIds])),
            },
            order: { user_id: "DESC" }
        });
        const users = [...preferredUsers, ...remainingUsers];
        if (!users.length)
            return (0, responseHandler_1.handleError)(res, 404, "Users Not Found");
        const latitude = (_h = req.user) === null || _h === void 0 ? void 0 : _h.latitude;
        const longitude = (_j = req.user) === null || _j === void 0 ? void 0 : _j.longitude;
        const final_data = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            let distance = null;
            const user_report = (yield userReportRepo.find({ where: { user: { user_id: user.user_id } }, relations: ["user"] })) || [];
            let personality_profile_percentage = null;
            if (user_report.length != 0) {
                let user_report_count = user_report.length;
                let total_score = 0;
                yield Promise.all(user_report.map((report) => {
                    total_score += Number(report.percentage);
                }));
                personality_profile_percentage = (total_score / user_report_count).toFixed(2);
            }
            const user_reports = yield userReportRepo.find({ where: { user: { user_id: user.user_id } } });
            const friend_request = yield friendRequestRepository.findOne({ where: { recipient: { user_id: user.user_id }, requester: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id }, status: (0, typeorm_1.Not)('No_Action') } });
            let is_request_sent = false;
            if (friend_request) {
                is_request_sent = true;
            }
            const like_data = yield UserLikeRequestRepo.findOne({ where: { like_by: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, like_to: { user_id: user.user_id } } });
            let is_liked = false;
            if (like_data) {
                is_liked = true;
            }
            const spark_data = yield sparkRepo.findOne({ where: { send_by: { user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id }, send_to: { user_id: user.user_id } } });
            let is_spark_sent = false;
            if (spark_data) {
                is_spark_sent = true;
            }
            const user_personality_profile_percentage = user_reports.length
                ? (user_reports.reduce((sum, report) => sum + Number(report.percentage), 0) / user_reports.length).toFixed(2)
                : 0;
            const match_percentage = Math.round((100 - Math.abs(Number(own_personality_profile_percentage) - Number(user_personality_profile_percentage))) * 100) / 100;
            let profile_images = yield profileImagesRepository.find({ where: { user: { user_id: user.user_id } } });
            let stuff = yield ProfileStuffRepository.find({ where: { recipient: { user_id: user === null || user === void 0 ? void 0 : user.user_id } } });
            let stuffCount = {
                kiss: 0,
                chocolate: 0,
                love: 0,
                flower: 0,
                flirty: 0
            };
            stuff.forEach(({ stuff_name }) => {
                if (stuff_name && stuffCount.hasOwnProperty(stuff_name)) {
                    stuffCount[stuff_name]++;
                }
            });
            profile_images = yield Promise.all(profile_images.map((profile_image) => __awaiter(void 0, void 0, void 0, function* () {
                if (profile_image.image && !profile_image.image.startsWith("http")) {
                    profile_image.image = `${APP_URL}${profile_image.image}`;
                }
                return Object.assign({}, profile_image);
            })));
            return Object.assign(Object.assign({}, user), {
                profile_image: user.profile_image && !user.profile_image.startsWith("http")
                    ? `${APP_URL}${user.profile_image}`
                    : user.profile_image, match_percentage: match_percentage || 0, profile_images, stuff: stuffCount, distance,
                is_request_sent,
                is_liked,
                is_spark_sent,
                personality_profile_percentage
            });
        })));
        const filteredResults = final_data.filter(Boolean);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Users Retrieved Successfully", filteredResults);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.home_page_match_api = home_page_match_api;
const get_slider_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const currentUserId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id;
        const userReportRepo = (0, typeorm_1.getRepository)(UserReport_1.UserReport);
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const friendRequestRepository = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const profileImagesRepository = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const ProfileStuffRepository = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        const blockedUserRepo = (0, typeorm_1.getRepository)(BlockedUser_1.BlockedUser);
        const UserLikeRequestRepo = (0, typeorm_1.getRepository)(UserLike_1.UserLike);
        const sparkRepo = (0, typeorm_1.getRepository)(Spark_1.Spark);
        const NotInterestedRepo = (0, typeorm_1.getRepository)(NotInterested_1.NotInterested);
        const user_reports = yield userReportRepo.find({ where: { user: { user_id } } });
        const own_personality_profile_percentage = user_reports.length
            ? (user_reports.reduce((sum, report) => sum + Number(report.percentage), 0) / user_reports.length).toFixed(2)
            : 0;
        let sparksSent = yield sparkRepo.find({
            where: { send_by: { user_id: currentUserId } },
            relations: ["send_to", "send_by"]
        });
        const sentToUserIds = sparksSent
            .map(spark => { var _a; return (_a = spark.send_to) === null || _a === void 0 ? void 0 : _a.user_id; })
            .filter(Boolean);
        const mutualSparks = yield sparkRepo.find({
            where: sentToUserIds.map(id => ({
                send_by: { user_id: id },
                send_to: { user_id: currentUserId }
            })),
            relations: ["send_by", "send_to"]
        });
        const mutualSparkUserIds = mutualSparks
            .map(spark => { var _a; return (_a = spark.send_by) === null || _a === void 0 ? void 0 : _a.user_id; })
            .filter(Boolean);
        console.log(mutualSparkUserIds, "mutualSparkUserIds");
        const blockedUsers = yield blockedUserRepo.find({
            where: [
                { blocker: { user_id }, is_blocked: true },
                { blocked: { user_id }, is_blocked: true }
            ],
            relations: ["blocker", "blocked"]
        });
        const blockedUserIds = blockedUsers.map(bu => bu.blocker.user_id === user_id ? bu.blocked.user_id : bu.blocker.user_id);
        const NotInterestedUsers = yield NotInterestedRepo.find({
            where: [
                { not_interested_by: { user_id } },
            ],
            relations: ["not_interested_by", "not_interested_to"]
        });
        const NotInterestedUserIds = NotInterestedUsers.map(entry => entry.not_interested_to.user_id);
        const excludedUserIds = [...blockedUserIds, ...NotInterestedUserIds, ...mutualSparkUserIds, user_id];
        let users = yield userRepository.find({
            where: {
                is_verified: true,
                is_active: true,
                user_id: (0, typeorm_1.Not)((0, typeorm_1.In)(excludedUserIds)),
                is_complete_profile: true,
                is_test_completed: true,
                is_profile_private: false
            },
            order: { user_id: "DESC" }
        });
        if (!users.length) {
            yield NotInterestedRepo.delete({ not_interested_by: { user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id } });
            const excludedUserIds = [...blockedUserIds, ...mutualSparkUserIds, user_id];
            users = yield userRepository.find({
                where: {
                    is_verified: true,
                    is_active: true,
                    user_id: (0, typeorm_1.Not)((0, typeorm_1.In)(excludedUserIds)),
                    is_complete_profile: true,
                    is_test_completed: true,
                    is_profile_private: false
                },
                order: { user_id: "DESC" }
            });
            if (!users.length) {
                return (0, responseHandler_1.handleError)(res, 404, "Users Not Found");
            }
        }
        const latitude = (_d = req.user) === null || _d === void 0 ? void 0 : _d.latitude;
        const longitude = (_e = req.user) === null || _e === void 0 ? void 0 : _e.longitude;
        const final_data = yield Promise.all(users.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c;
            const user_report = (yield userReportRepo.find({ where: { user: { user_id: user.user_id } }, relations: ["user"] })) || [];
            let location = null;
            if (user.latitude && user.longitude) {
                location = yield (0, function_1.getCityAndStateFromCoordinates)(user.latitude, user.longitude);
            }
            let personality_profile_percentage = null;
            if (user_report.length != 0) {
                let user_report_count = user_report.length;
                let total_score = 0;
                yield Promise.all(user_report.map((report) => {
                    total_score += Number(report.percentage);
                }));
                personality_profile_percentage = (total_score / user_report_count).toFixed(2);
            }
            const user_reports = yield userReportRepo.find({ where: { user: { user_id: user.user_id } } });
            const friend_request = yield friendRequestRepository.findOne({ where: { recipient: { user_id: user.user_id }, requester: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id }, status: (0, typeorm_1.Not)('No_Action') } });
            let is_request_sent = false;
            if (friend_request) {
                console.log(friend_request, "friend_request");
                is_request_sent = true;
            }
            const like_data = yield UserLikeRequestRepo.findOne({ where: { like_by: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, like_to: { user_id: user.user_id } } });
            let is_liked = false;
            if (like_data) {
                is_liked = true;
            }
            const spark_data = yield sparkRepo.findOne({ where: { send_by: { user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id }, send_to: { user_id: user.user_id } } });
            let is_spark_sent = false;
            if (spark_data) {
                is_spark_sent = true;
            }
            const user_personality_profile_percentage = user_reports.length
                ? (user_reports.reduce((sum, report) => sum + Number(report.percentage), 0) / user_reports.length).toFixed(2)
                : 0;
            // const match_percentage = (100 - Math.abs(Number(own_personality_profile_percentage) - Number(user_personality_profile_percentage))).toFixed(2);
            const match_percentage = Math.round((100 - Math.abs(Number(own_personality_profile_percentage) - Number(user_personality_profile_percentage))) * 100) / 100;
            let profile_images = yield profileImagesRepository.find({ where: { user: { user_id: user.user_id } } });
            let stuff = yield ProfileStuffRepository.find({ where: { recipient: { user_id: user === null || user === void 0 ? void 0 : user.user_id } } });
            let stuffCount = {
                kiss: 0,
                chocolate: 0,
                love: 0,
                flower: 0,
                flirty: 0
            };
            stuff.forEach(({ stuff_name }) => {
                if (stuff_name && stuffCount.hasOwnProperty(stuff_name)) {
                    stuffCount[stuff_name]++;
                }
            });
            let distance = null;
            if (user.latitude && user.longitude && latitude && longitude) {
                distance = (0, function_1.calculateDistance)(latitude, longitude, user.latitude, user.longitude).toFixed(2) + " km";
            }
            profile_images = yield Promise.all(profile_images.map((profile_image) => __awaiter(void 0, void 0, void 0, function* () {
                if (profile_image.image && !profile_image.image.startsWith("http")) {
                    profile_image.image = `${APP_URL}${profile_image.image}`;
                }
                return Object.assign({}, profile_image);
            })));
            return Object.assign(Object.assign({}, user), {
                profile_image: user.profile_image && !user.profile_image.startsWith("http")
                    ? `${APP_URL}${user.profile_image}`
                    : user.profile_image, match_percentage: match_percentage || 0, profile_images, stuff: stuffCount, distance,
                is_request_sent,
                is_liked,
                is_spark_sent,
                location,
                personality_profile_percentage
            });
        })));
        return (0, responseHandler_1.handleSuccess)(res, 200, "Users Retrieved Successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_slider_user = get_slider_user;
const get_user_by_id = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        let target_user_id = null;
        if (typeof req.query.user_id === 'string') {
            target_user_id = parseInt(req.query.user_id);
        }
        else {
            target_user_id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id);
        }
        const user_id = (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id;
        const userRepo = (0, typeorm_1.getRepository)(User_1.User);
        const userReportRepo = (0, typeorm_1.getRepository)(UserReport_1.UserReport);
        const friendRequestRepo = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const profileImageRepo = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const profileStuffRepo = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        const blockedUserRepo = (0, typeorm_1.getRepository)(BlockedUser_1.BlockedUser);
        const userLikeRepo = (0, typeorm_1.getRepository)(UserLike_1.UserLike);
        const friendRequestRepository = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const sparkRepository = (0, typeorm_1.getRepository)(Spark_1.Spark);
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        const user_report = (yield userReportRepo.find({ where: { user: { user_id: target_user_id } }, relations: ["user"] })) || [];
        let personality_profile_percentage = null;
        if (user_report.length != 0) {
            let user_report_count = user_report.length;
            let total_score = 0;
            yield Promise.all(user_report.map((report) => {
                total_score += Number(report.percentage);
            }));
            personality_profile_percentage = (total_score / user_report_count).toFixed(2);
        }
        const user = yield userRepo.findOne({ where: { user_id: target_user_id, is_verified: true } });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        }
        let profile_images = yield profileImageRepo.find({ where: { user: { user_id: target_user_id } } });
        profile_images = profile_images.map((img) => (Object.assign(Object.assign({}, img), { image: img.image && !img.image.startsWith("http") ? `${APP_URL}${img.image}` : img.image })));
        const stuff = yield profileStuffRepo.find({ where: { recipient: { user_id: target_user_id } } });
        let stuffCount = {
            kiss: 0,
            chocolate: 0,
            love: 0,
            flower: 0,
            flirty: 0
        };
        stuff.forEach(({ stuff_name }) => {
            if (stuff_name && stuffCount.hasOwnProperty(stuff_name)) {
                stuffCount[stuff_name]++;
            }
        });
        const own_reports = yield userReportRepo.find({ where: { user: { user_id } } });
        const target_reports = yield userReportRepo.find({ where: { user: { user_id: target_user_id } } });
        const own_percentage = own_reports.length
            ? (own_reports.reduce((sum, r) => sum + Number(r.percentage), 0) / own_reports.length)
            : 0;
        const target_percentage = target_reports.length
            ? (target_reports.reduce((sum, r) => sum + Number(r.percentage), 0) / target_reports.length)
            : 0;
        const match_percentage = Math.round((100 - Math.abs(Number(own_percentage) - Number(target_percentage))) * 100) / 100;
        const friend_request = yield friendRequestRepo.findOne({
            where: {
                recipient: { user_id: target_user_id },
                requester: { user_id },
                status: (0, typeorm_1.Not)("No_Action")
            }
        });
        const is_request_sent = !!friend_request;
        const friend_request_received = yield friendRequestRepo.findOne({
            where: {
                recipient: { user_id },
                requester: { user_id: target_user_id },
                status: "Pending",
            },
        });
        const is_request_received = !!friend_request_received;
        const friend_data = yield friendRequestRepository.findOne({
            where: [
                {
                    recipient: { user_id: user.user_id },
                    requester: { user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id },
                    status: 'Accepted',
                },
                {
                    recipient: { user_id: (_d = req.user) === null || _d === void 0 ? void 0 : _d.user_id },
                    requester: { user_id: user.user_id },
                    status: 'Accepted',
                },
            ],
        });
        let is_friend = false;
        if (friend_data) {
            is_friend = true;
        }
        const spark_data = yield sparkRepository.findOne({
            where: {
                send_by: { user_id: (_e = req.user) === null || _e === void 0 ? void 0 : _e.user_id },
                send_to: { user_id: user.user_id },
            },
        });
        let is_spark_sent = !!spark_data;
        const spark_data_user = yield sparkRepository.findOne({
            where: {
                send_to: { user_id: (_f = req.user) === null || _f === void 0 ? void 0 : _f.user_id },
                send_by: { user_id: user.user_id },
            },
            relations: ['send_to', 'send_by'],
        });
        let is_spark_matched = !!spark_data_user;
        let is_blocked = false;
        const isBlocked = yield blockedUserRepo.findOne({
            where: {
                blocker: { user_id },
                blocked: { user_id: target_user_id },
                is_blocked: true
            }
        });
        if (isBlocked) {
            is_blocked = true;
        }
        let is_other_user_blocked = false;
        const isOtherUserBlocked = yield blockedUserRepo.findOne({
            where: {
                blocker: { user_id: target_user_id },
                blocked: { user_id },
                is_blocked: true
            }
        });
        if (isOtherUserBlocked) {
            is_other_user_blocked = true;
        }
        const like_data = yield userLikeRepo.findOne({
            where: {
                like_by: { user_id },
                like_to: { user_id: target_user_id }
            }
        });
        const is_liked = !!like_data;
        let distance = null;
        if (user.latitude && user.longitude && ((_g = req.user) === null || _g === void 0 ? void 0 : _g.latitude) && ((_h = req.user) === null || _h === void 0 ? void 0 : _h.longitude)) {
            distance = (0, function_1.calculateDistance)(req.user.latitude, req.user.longitude, user.latitude, user.longitude).toFixed(2) + " km";
        }
        const user_subscription = yield userSubscriptionRepo.findOne({ where: { user: { user_id: (_j = req.user) === null || _j === void 0 ? void 0 : _j.user_id }, isActive: true }, relations: ["plan"] });
        let subscription_plan_id = null;
        if (user_subscription) {
            subscription_plan_id = user_subscription.plan.subscription_plan_id;
        }
        const UsersFaceRepository = (0, typeorm_1.getRepository)(UsersFace_1.UsersFace);
        console.log('user_id', user_id);

        const userFace = yield UsersFaceRepository.findOneBy({ user_id: user_id });
        console.log('userFace.length', userFace);

        const final_data = Object.assign(Object.assign({}, user), {
            profile_image: user.profile_image && !user.profile_image.startsWith("http")
                ? `${APP_URL}${user.profile_image}`
                : user.profile_image, profile_images, stuff: stuffCount, match_percentage,
            distance,
            is_request_sent,
            is_liked,
            is_blocked,
            is_other_user_blocked,
            is_friend,
            is_spark_sent,
            is_spark_matched,
            personality_profile_percentage,
            is_request_received,
            subscription_plan_id,
            isFaceVerificationDone: userFace ? 0 : 1
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "User Retrieved Successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_user_by_id = get_user_by_id;
const send_friend_request = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let friend_request_schema = joi_1.default.object({
            recipient_id: joi_1.default.number().required(),
        });
        const { error, value } = friend_request_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { recipient_id } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const FriendRequestRepo = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id) == recipient_id) {
            return (0, responseHandler_1.handleError)(res, 400, "You Can Not Send Friend Request Your Self");
        }
        const user_data = yield userRepository.findOne({ where: { user_id: recipient_id } });
        if (!user_data)
            return (0, responseHandler_1.handleError)(res, 404, "Recipient User Not Found");
        const request_data = yield FriendRequestRepo.findOne({ where: { requester: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, recipient: { user_id: recipient_id } } });
        if (!request_data) {
            const newRequest = FriendRequestRepo.create({
                requester: req.user,
                recipient: user_data,
                status: "Pending"
            });
            yield FriendRequestRepo.save(newRequest);
            let notification_title = `${(_c = req.user) === null || _c === void 0 ? void 0 : _c.full_name}`;
            let notification_message = `You have a new friend request!`;
            if (user_data.is_push_notification_on) {
                yield (0, firebaseUser_1.sendNotificationUser)(user_data.fcm_token, notification_title, notification_message, {});
            }
            let newNotification = NotificationRepo.create({
                recipient: user_data,
                notification_type: "friend_request",
                sender: req.user,
                notificaton_title: notification_title,
                notification_message: notification_message,
            });
            yield NotificationRepo.save(newNotification);
        }
        else {
            return (0, responseHandler_1.handleError)(res, 400, "You have already sent a request.");
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Request sent successfully.");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.send_friend_request = send_friend_request;
// export const like_unlike_user = async (req: Request, res: Response) => {
//     try {
//         let schema = Joi.object({
//             user_id: Joi.number().required(),
//             status: Joi.string().valid('like', 'unlike').required(),
//         });
//         const { error, value } = schema.validate(req.body);
//         if (error) return joiErrorHandle(res, error);
//         const { user_id, status } = value;
//         const userRepository = getRepository(User);
//         const UserLikeRequestRepo = getRepository(UserLike);
//         const FriendRequestRepo = getRepository(FriendRequest);
//         const NotificationRepo = getRepository(Notification);
//         const user_data = await userRepository.findOne({ where: { user_id: user_id } });
//         if (!user_data) return handleError(res, 404, "User Not Found");
//         if (status == 'like') {
//             const like_data = await UserLikeRequestRepo.findOne({ where: { like_by: { user_id: req.user?.user_id }, like_to: { user_id: user_id } } });
//             if (!like_data) {
//                 const userSubscriptionRepo = getRepository(UserSubscription);
//                 const userSubscription = await userSubscriptionRepo.findOne({ where: { user: { user_id : req.user?.user_id }, isActive: true }, relations: ["plan"] });
//                 if (!userSubscription) {
//                     return handleError(res, 400, "User subscription not found");
//                 }
//                 if (userSubscription.plan.subscription_plan_id == 1) {
//                     const subscriptionPlanRepo = getRepository(SubscriptionPlan);
//                     const subscriptionPlan = await subscriptionPlanRepo.findOne({ where: { subscription_plan_id: userSubscription.plan.subscription_plan_id } });
//                     if (!subscriptionPlan) {
//                         return handleError(res, 400, "Subscription plan not found");
//                     }
//                     const planLimitsRepo = getRepository(PlanLimits);
//                     const planLimits = await planLimitsRepo.findOne({ where: { plan: { subscription_plan_id: userSubscription.plan.subscription_plan_id } } });
//                     if (!planLimits) {
//                         return handleError(res, 400, "Plan limits not found");
//                     }
//                     const userDailyUsageRepo = getRepository(UserDailyUsage);
//                     let formatedDate = new Date().toISOString().split('T')[0];
//                     const userDailyUsage = await userDailyUsageRepo.findOne({ where: { user: { user_id : req.user?.user_id }, date: new Date(formatedDate) } });
//                     console.log(userDailyUsage, "like userDailyUsage");
//                     if (!userDailyUsage) {
//                         const newUserDailyUsage = userDailyUsageRepo.create({
//                             date: formatedDate,
//                             user: req.user,
//                             likes_used: 1
//                         });
//                         await userDailyUsageRepo.save(newUserDailyUsage);
//                     } else {
//                         userDailyUsage.likes_used = Number(userDailyUsage.likes_used) + 1;
//                         await userDailyUsageRepo.save(userDailyUsage);
//                     }
//                     if (userDailyUsage && userDailyUsage.likes_used > planLimits.daily_likes_limit) {
//                         return handleError(res, 429, "You have reached your daily limit of likes.");
//                     }
//                 }
//                 const newLike = UserLikeRequestRepo.create({
//                     like_by: req.user,
//                     like_to: user_data,
//                 })
//                 let saved_user_like = await UserLikeRequestRepo.save(newLike);
//                 let notification_message = `You have a new like! 👍`;
//                 let notification_title = `${req.user?.full_name}`
//                 await sendNotificationUser(user_data.fcm_token, notification_title, notification_message, {})
//                 let newNotification_like = NotificationRepo.create({
//                     recipient: user_data,
//                     notification_type: "like",
//                     sender: req.user,
//                     notificaton_title: notification_title,
//                     notification_message: notification_message,
//                 })
//                 await NotificationRepo.save(newNotification_like);
//             }
//         } else {
//             return handleError(res, 400, "You have already like.");
//         }
//         if (status == 'unlike') {
//             const unlike_data = await UserLikeRequestRepo.findOne({ where: { like_by: { user_id: req.user?.user_id }, like_to: { user_id: user_id } } });
//             if (!unlike_data) {
//                 return handleError(res, 400, "Unliked Already")
//             }
//             await NotificationRepo.delete({ notification_type: 'like', recipient: { user_id: user_id } });
//             await UserLikeRequestRepo.delete(unlike_data.user_like_id)
//         }
//         return handleSuccess(res, 200, `${status} successfully.`);
//     } catch (error: any) {
//         return handleError(res, 500, error.message);
//     }
// };
const like_unlike_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const schema = joi_1.default.object({
            user_id: joi_1.default.number().required(),
            status: joi_1.default.string().valid('like', 'unlike').required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { user_id, status } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const userLikeRepo = (0, typeorm_1.getRepository)(UserLike_1.UserLike);
        const friendRequestRepo = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const notificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const user_data = yield userRepository.findOne({ where: { user_id } });
        if (!user_data)
            return (0, responseHandler_1.handleError)(res, 404, "User not found");
        if (status === 'like') {
            const existingLike = yield userLikeRepo.findOne({
                where: {
                    like_by: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id },
                    like_to: { user_id },
                },
            });
            if (existingLike) {
                return (0, responseHandler_1.handleError)(res, 400, "You have already liked this user.");
            }
            // Subscription check
            const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
            let userSubscription = yield userSubscriptionRepo.findOne({
                where: { user: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, isActive: true },
                relations: ["plan"],
            });
            if (!userSubscription) {
                const newUserSubscription = userSubscriptionRepo.create({
                    user: req.user,
                    plan: { subscription_plan_id: 1 },
                    isActive: true,
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                });
                userSubscription = yield userSubscriptionRepo.save(newUserSubscription);
            }
            userSubscription = yield userSubscriptionRepo.findOne({
                where: { user: { user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id }, isActive: true },
                relations: ["plan"],
            });
            if ((userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.plan.subscription_plan_id) == 1) {
                const planLimitsRepo = (0, typeorm_1.getRepository)(PlanLimits_1.PlanLimits);
                const planLimits = yield planLimitsRepo.findOne({
                    where: { plan: { subscription_plan_id: 1 } },
                });
                if (!planLimits) {
                    return (0, responseHandler_1.handleError)(res, 400, "Plan limits not found");
                }
                const userDailyUsageRepo = (0, typeorm_1.getRepository)(UserDailyUsage_1.UserDailyUsage);
                const todayDate = new Date().toISOString().split('T')[0];
                let dailyUsage = yield userDailyUsageRepo.findOne({
                    where: {
                        user: { user_id: (_d = req.user) === null || _d === void 0 ? void 0 : _d.user_id },
                        date: new Date(todayDate),
                    },
                });
                if (dailyUsage && dailyUsage.likes_used >= planLimits.daily_likes_limit) {
                    return (0, responseHandler_1.handleError)(res, 429, "You have reached your daily like limit.");
                }
                if (!dailyUsage) {
                    dailyUsage = userDailyUsageRepo.create({
                        date: todayDate,
                        user: req.user,
                        likes_used: 1,
                    });
                }
                else {
                    dailyUsage.likes_used = Number(dailyUsage.likes_used) + 1;
                }
                yield userDailyUsageRepo.save(dailyUsage);
            }
            const newLike = userLikeRepo.create({
                like_by: req.user,
                like_to: user_data,
            });
            yield userLikeRepo.save(newLike);
            const notification_message = `You have a new like! 👍`;
            const notification_title = `${(_e = req.user) === null || _e === void 0 ? void 0 : _e.full_name}`;
            yield (0, firebaseUser_1.sendNotificationUser)(user_data.fcm_token, notification_title, notification_message, {});
            const newNotification = notificationRepo.create({
                recipient: user_data,
                notification_type: "like",
                sender: req.user,
                notificaton_title: notification_title,
                notification_message: notification_message,
            });
            yield notificationRepo.save(newNotification);
        }
        else if (status === 'unlike') {
            const likeRecord = yield userLikeRepo.findOne({
                where: {
                    like_by: { user_id: (_f = req.user) === null || _f === void 0 ? void 0 : _f.user_id },
                    like_to: { user_id },
                },
            });
            if (!likeRecord) {
                return (0, responseHandler_1.handleError)(res, 400, "You have already unliked this user.");
            }
            yield notificationRepo.delete({
                notification_type: 'like',
                recipient: { user_id },
                sender: { user_id: (_g = req.user) === null || _g === void 0 ? void 0 : _g.user_id },
            });
            yield userLikeRepo.delete(likeRecord.user_like_id);
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, `${status} successfully.`);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.like_unlike_user = like_unlike_user;
const send_spark = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        let schema = joi_1.default.object({
            user_id: joi_1.default.number().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { user_id } = value;
        const req_user = req.user;
        if (!req_user)
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const UserLikeRequestRepo = (0, typeorm_1.getRepository)(UserLike_1.UserLike);
        const sparkRepo = (0, typeorm_1.getRepository)(Spark_1.Spark);
        const FriendRequestRepo = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id) == user_id) {
            return (0, responseHandler_1.handleError)(res, 400, "You Can Not Send Friend Request Your Self");
        }
        const user_data = yield userRepository.findOne({ where: { user_id: user_id } });
        if (!user_data)
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        let userSubscription = yield userSubscriptionRepo.findOne({ where: { user: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, isActive: true }, relations: ["plan"] });
        if (!userSubscription) {
            const newUserSubscription = userSubscriptionRepo.create({
                user: req.user,
                plan: { subscription_plan_id: 1 },
                isActive: true,
                startDate: new Date(),
                endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            });
            userSubscription = yield userSubscriptionRepo.save(newUserSubscription);
        }
        userSubscription = yield userSubscriptionRepo.findOne({ where: { user: { user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id }, isActive: true }, relations: ["plan"] });
        if ((userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.plan.subscription_plan_id) == 1) {
            const planLimitsRepo = (0, typeorm_1.getRepository)(PlanLimits_1.PlanLimits);
            const planLimits = yield planLimitsRepo.findOne({ where: { plan: { subscription_plan_id: userSubscription === null || userSubscription === void 0 ? void 0 : userSubscription.plan.subscription_plan_id } } });
            if (!planLimits) {
                return (0, responseHandler_1.handleError)(res, 400, "Plan limits not found");
            }
            const userDailyUsageRepo = (0, typeorm_1.getRepository)(UserDailyUsage_1.UserDailyUsage);
            let formatedDate = new Date().toISOString().split('T')[0];
            const userDailyUsage = yield userDailyUsageRepo.findOne({ where: { user: { user_id: (_d = req.user) === null || _d === void 0 ? void 0 : _d.user_id }, date: new Date(formatedDate) } });
            if (!userDailyUsage) {
                const newUserDailyUsage = userDailyUsageRepo.create({
                    date: formatedDate,
                    user: req.user,
                    sparks_used: 1
                });
                yield userDailyUsageRepo.save(newUserDailyUsage);
            }
            else {
                userDailyUsage.sparks_used = Number(userDailyUsage.sparks_used) + 1;
                yield userDailyUsageRepo.save(userDailyUsage);
            }
            if (userDailyUsage && userDailyUsage.sparks_used > planLimits.daily_sparks_limit) {
                return (0, responseHandler_1.handleError)(res, 429, "You have reached your daily limit of sparks.");
            }
        }
        const spark_data = yield sparkRepo.findOne({ where: { send_by: { user_id: (_e = req.user) === null || _e === void 0 ? void 0 : _e.user_id }, send_to: { user_id: user_id } } });
        if (spark_data)
            return (0, responseHandler_1.handleError)(res, 400, 'You Already Sent Spark to this user');
        const newSpark = yield sparkRepo.create({
            send_by: req.user,
            send_to: user_data,
        });
        yield sparkRepo.save(newSpark);
        let notification_title = `${(_f = req.user) === null || _f === void 0 ? void 0 : _f.full_name}`;
        let notification_message = 'You have a new spark! ✨';
        if (user_data.is_push_notification_on) {
            yield (0, firebaseUser_1.sendNotificationUser)(user_data.fcm_token, notification_title, notification_message, {});
        }
        let newNotification_spark = NotificationRepo.create({
            recipient: user_data,
            notification_type: "spark",
            sender: req.user,
            notificaton_title: notification_title,
            notification_message: notification_message,
        });
        yield NotificationRepo.save(newNotification_spark);
        const spark_data_user = yield sparkRepo.findOne({ where: { send_to: { user_id: (_g = req.user) === null || _g === void 0 ? void 0 : _g.user_id }, send_by: { user_id: user_id } }, relations: ['send_to', 'send_by'] });
        if (spark_data_user) {
            let notification_title = spark_data_user.send_to.full_name;
            let notification_message = 'You have a new match! 💕';
            const existingMatchNotification = yield NotificationRepo.findOne({
                where: {
                    notification_type: "match",
                    sender: { user_id: (_h = req.user) === null || _h === void 0 ? void 0 : _h.user_id },
                    recipient: { user_id: user_data.user_id }
                }
            });
            if (!existingMatchNotification) {
                if (user_data.is_push_notification_on) {
                    yield (0, firebaseUser_1.sendNotificationUser)(user_data.fcm_token, notification_title, notification_message, {});
                }
                const newNotification1 = NotificationRepo.create({
                    recipient: user_data,
                    notification_type: "match",
                    sender: req.user,
                    notificaton_title: notification_title,
                    notification_message: notification_message,
                });
                yield NotificationRepo.save(newNotification1);
            }
            const existingMatchNotificationReverse = yield NotificationRepo.findOne({
                where: {
                    notification_type: "match",
                    sender: { user_id: user_data.user_id },
                    recipient: { user_id: (_j = req.user) === null || _j === void 0 ? void 0 : _j.user_id }
                }
            });
            if (!existingMatchNotificationReverse) {
                if (req_user.is_push_notification_on) {
                    yield (0, firebaseUser_1.sendNotificationUser)(req_user.fcm_token, notification_title, notification_message, {});
                }
                const newNotification = NotificationRepo.create({
                    recipient: req.user,
                    notification_type: "match",
                    sender: user_data,
                    notificaton_title: notification_title,
                    notification_message: notification_message,
                });
                yield NotificationRepo.save(newNotification);
            }
            // if (user_data.is_push_notification_on) {
            //     await sendNotificationUser(user_data.fcm_token, notification_title, notification_message, {})
            // }
            // let newNotification1 = NotificationRepo.create({
            //     recipient: user_data,
            //     notification_type: "match",
            //     sender: req.user,
            //     notificaton_title: notification_title,
            //     notification_message: notification_message,
            // })
            // await NotificationRepo.save(newNotification1);
            // notification_title = spark_data_user.send_by.full_name
            // if (req_user.is_push_notification_on) {
            //     await sendNotificationUser(req_user.fcm_token, notification_title, notification_message, {})
            // }
            // let newNotification = NotificationRepo.create({
            //     recipient: req.user,
            //     notification_type: "match",
            //     sender: user_data,
            //     notificaton_title: notification_title,
            //     notification_message: notification_message,
            // })
            // await NotificationRepo.save(newNotification);
            yield NotificationRepo.delete({
                notification_type: "spark",
                sender: { user_id: user_id },
                recipient: { user_id: (_k = req.user) === null || _k === void 0 ? void 0 : _k.user_id }
            });
            yield NotificationRepo.delete({
                notification_type: "spark",
                sender: { user_id: (_l = req.user) === null || _l === void 0 ? void 0 : _l.user_id },
                recipient: { user_id: user_id }
            });
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, `Spark Sent Successfully.`);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.send_spark = send_spark;
const get_request_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const user_lat = (_b = req.user) === null || _b === void 0 ? void 0 : _b.latitude;
        const user_lng = (_c = req.user) === null || _c === void 0 ? void 0 : _c.longitude;
        if (!user_id) {
            return (0, responseHandler_1.handleError)(res, 400, "User ID is required.");
        }
        const FriendRequestRepo = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const UserReportRepo = (0, typeorm_1.getRepository)(UserReport_1.UserReport);
        let request_list = yield FriendRequestRepo.find({
            where: { recipient: { user_id }, status: "Pending" },
            relations: ["requester"],
            order: { created_at: "DESC" }
        });
        if (request_list.length === 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "Request List Retrieved Successfully", []);
        }
        const own_reports = yield UserReportRepo.find({ where: { user: { user_id } } });
        const own_percentage = own_reports.length
            ? (own_reports.reduce((sum, r) => sum + Number(r.percentage), 0) / own_reports.length)
            : 0;
        const final_data = yield Promise.all(request_list.map((request_user) => __awaiter(void 0, void 0, void 0, function* () {
            const requester = request_user.requester;
            if (requester.profile_image && !requester.profile_image.startsWith("http")) {
                requester.profile_image = `${APP_URL}${requester.profile_image}`;
            }
            const requester_reports = yield UserReportRepo.find({ where: { user: { user_id: requester.user_id } } });
            const target_percentage = requester_reports.length
                ? (requester_reports.reduce((sum, r) => sum + Number(r.percentage), 0) / requester_reports.length)
                : 0;
            const match_percentage = 100 - Math.abs(own_percentage - target_percentage);
            let distance = null;
            if (requester.latitude && requester.longitude &&
                user_lat && user_lng) {
                distance = (0, function_1.calculateDistance)(user_lat, user_lng, requester.latitude, requester.longitude).toFixed(2) + " km";
            }
            return Object.assign(Object.assign({}, request_user), { match_percentage: match_percentage.toFixed(2), distance });
        })));
        return (0, responseHandler_1.handleSuccess)(res, 200, "Request List Retrieved Successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.get_request_list = get_request_list;
const getFriends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const FriendRequestRepository = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const profileImagesRepository = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const blockedUserRepo = (0, typeorm_1.getRepository)(BlockedUser_1.BlockedUser);
        const latitude = (_b = req.user) === null || _b === void 0 ? void 0 : _b.latitude;
        const longitude = (_c = req.user) === null || _c === void 0 ? void 0 : _c.longitude;
        const blockedUsers = yield blockedUserRepo.find({
            where: [
                { blocker: { user_id } },
                { blocked: { user_id } }
            ],
            relations: ["blocker", "blocked"]
        });
        const blockedUserIds = blockedUsers.map(bu => bu.blocker.user_id === user_id ? bu.blocked.user_id : bu.blocker.user_id);
        const friends = yield FriendRequestRepository.find({
            where: [
                { requester: { user_id }, status: "Accepted", recipient: { user_id: (0, typeorm_1.Not)((0, typeorm_1.In)(blockedUserIds)) } },
                { recipient: { user_id }, status: "Accepted", requester: { user_id: (0, typeorm_1.Not)((0, typeorm_1.In)(blockedUserIds)) } }
            ],
            relations: ["requester", "recipient"],
            order: { created_at: "DESC" }
        });
        if (!friends.length) {
            return (0, responseHandler_1.handleError)(res, 404, "No Friends Found");
        }
        let friendsList = yield Promise.all(friends.map((friend) => __awaiter(void 0, void 0, void 0, function* () {
            let friendUser = friend.requester.user_id == user_id ? friend.recipient : friend.requester;
            let profile_images = yield profileImagesRepository.find({ where: { user: { user_id: friendUser.user_id } } });
            let distance = null;
            if (friendUser.latitude && friendUser.longitude && latitude && longitude) {
                distance = (0, function_1.calculateDistance)(latitude, longitude, friendUser.latitude, friendUser.longitude).toFixed(2) + " km";
            }
            if (friendUser.profile_image && !friendUser.profile_image.startsWith("http")) {
                friendUser.profile_image = `${APP_URL}${friendUser.profile_image}`;
            }
            profile_images = yield Promise.all(profile_images.map((profile_image) => __awaiter(void 0, void 0, void 0, function* () {
                if (profile_image.image && !profile_image.image.startsWith("http")) {
                    profile_image.image = `${APP_URL}${profile_image.image}`;
                }
                return Object.assign({}, profile_image);
            })));
            return {
                friendUser,
                profile_images,
                distance
            };
        })));
        return (0, responseHandler_1.handleSuccess)(res, 200, "Friends Retrieved Successfully", friendsList);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getFriends = getFriends;
const accept_reject_request = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let friend_request_schema = joi_1.default.object({
            user_id: joi_1.default.number().required(),
            request_status: joi_1.default.string().valid("Accepted", "Rejected").required(),
        });
        const { error, value } = friend_request_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { user_id, request_status } = value;
        const FriendRequestRepo = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const request_data = yield FriendRequestRepo.findOne({
            where: { requester: { user_id: user_id }, recipient: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id } }, relations: ["requester", "requester"]
        });
        if (!request_data) {
            return (0, responseHandler_1.handleError)(res, 404, "Request Not Found.");
        }
        else {
            yield NotificationRepo.delete({ notification_type: "friend_request", recipient: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, sender: { user_id: user_id } });
            if (request_status == 'Rejected') {
                yield FriendRequestRepo.delete(request_data.request_id);
            }
            else {
                if (request_status)
                    request_data.status = request_status;
                yield FriendRequestRepo.save(request_data);
                let notification_title = `${(_c = req.user) === null || _c === void 0 ? void 0 : _c.full_name}`;
                let notification_message = `Your Friend Request Accepted!`;
                if (request_data.requester.is_push_notification_on) {
                    yield (0, firebaseUser_1.sendNotificationUser)(request_data.requester.fcm_token, notification_title, notification_message, {});
                }
            }
        }
        // let newNotification = NotificationRepo.create({
        //     recipient: request_data.requester,
        //     notification_type: "match",
        //     sender: req.user,
        //     notificaton_title: notification_title,
        //     notification_message: notification_message,
        // })
        // await NotificationRepo.save(newNotification);
        return (0, responseHandler_1.handleSuccess)(res, 200, `Request ${request_status} Successfully.`);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.accept_reject_request = accept_reject_request;
const not_interested_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let schema = joi_1.default.object({
            user_id: joi_1.default.number().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { user_id, status } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const UserLikeRequestRepo = (0, typeorm_1.getRepository)(UserLike_1.UserLike);
        const FriendRequestRepo = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const NotInterestedRepo = (0, typeorm_1.getRepository)(NotInterested_1.NotInterested);
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id) == user_id) {
            return (0, responseHandler_1.handleError)(res, 400, "You Can Not Do This Operation");
        }
        const user_data = yield userRepository.findOne({ where: { user_id: user_id } });
        if (!user_data)
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        const not_interested_data = yield NotInterestedRepo.findOne({ where: { not_interested_by: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, not_interested_to: { user_id: user_id } } });
        if (not_interested_data) {
            return (0, responseHandler_1.handleError)(res, 400, "You Have Already Not Interested this user");
        }
        const newNotInterested = NotInterestedRepo.create({
            not_interested_by: req.user,
            not_interested_to: user_data,
        });
        yield NotInterestedRepo.save(newNotInterested);
        return (0, responseHandler_1.handleSuccess)(res, 200, `Not interested user successfully.`);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.not_interested_user = not_interested_user;
const MyFavorites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const FriendRequestRepository = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        const profileImagesRepository = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const blockedUserRepo = (0, typeorm_1.getRepository)(BlockedUser_1.BlockedUser);
        const userLikeRepo = (0, typeorm_1.getRepository)(UserLike_1.UserLike);
        const Favorites_data = yield userLikeRepo.find({
            where: { like_by: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id } },
            relations: ['like_by', 'like_to'],
            order: { created_at: "DESC" }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Favorites List Retrieved Successfully", Favorites_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.MyFavorites = MyFavorites;
const remove_friend = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let remove_friend_schema = joi_1.default.object({
            friend_id: joi_1.default.number().required(),
        });
        const { error, value } = remove_friend_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { friend_id } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const FriendRequestRepo = (0, typeorm_1.getRepository)(FriendRequest_1.FriendRequest);
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id) === friend_id) {
            return (0, responseHandler_1.handleError)(res, 400, "You cannot remove yourself.");
        }
        const friend_user = yield userRepository.findOne({ where: { user_id: friend_id } });
        if (!friend_user)
            return (0, responseHandler_1.handleError)(res, 404, "Friend user not found.");
        const friendship = yield FriendRequestRepo.findOne({
            where: [
                { requester: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, recipient: { user_id: friend_id }, status: 'Accepted' },
                { requester: { user_id: friend_id }, recipient: { user_id: (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id }, status: 'Accepted' }
            ]
        });
        if (!friendship) {
            return (0, responseHandler_1.handleError)(res, 404, "Friendship not found.");
        }
        yield FriendRequestRepo.remove(friendship);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Friend removed successfully.");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.remove_friend = remove_friend;



// ------------------------------------contact support api ----------------------------------------------//
const create_contact_support = async (req, res) => {
    try {
        const user_id = req.user;
        const { email, phone_number, message } = req.body;
        const ContactSupportRepo = (0, typeorm_1.getRepository)(ContactSupport_1.ContactSupport);
        const contactSupportEntry = ContactSupportRepo.create({
            user_id: user_id.user_id,
            email,
            phone_number,
            message
        });
        await ContactSupportRepo.save(contactSupportEntry);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Support request submitted successfully.");
    } catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
};
exports.create_contact_support = create_contact_support;

const face_verification = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        console.log('req.file', req.file);

        const imageBuffer = req.file.buffer;

        // List all blocked user images from 'blockedUsersImage/' folder
        const blockedKeys = await listBlockedImagesFromS3('blockedUsersImage/');

        for (const key of blockedKeys) {
            console.log('Comparing with blocked image:', key);

            // Optional: Detect faces to skip invalid images
            const detectUploaded = await rekognition.detectFaces({
                Image: { Bytes: imageBuffer }
            }).promise();

            const detectBlocked = await rekognition.detectFaces({
                Image: {
                    S3Object: { Bucket: process.env.S3_BUCKET_NAME, Name: key }
                }
            }).promise();

            if (detectUploaded.FaceDetails.length === 0 || detectBlocked.FaceDetails.length === 0) {
                console.log('No face detected in one of the images, skipping...');
                continue;
            }

            // Compare faces
            const compareParams = {
                SourceImage: { Bytes: imageBuffer },
                TargetImage: {
                    S3Object: {
                        Bucket: process.env.S3_BUCKET_NAME,
                        Name: key
                    }
                },
                SimilarityThreshold: 90
            };

            const result = await rekognition.compareFaces(compareParams).promise();
            console.log('Compare Result:', JSON.stringify(result, null, 2));

            if (result.FaceMatches && result.FaceMatches.length > 0) {
                console.log('Matched with blocked image:', key);

                return res.status(403).json({
                    message: 'Access denied. Face matched with a blocked user image.',
                    matched_image_key: key
                });
            }
        }

        // No match found
        return (0, responseHandler_1.handleSuccess)(res, 200, 'Face verification passed.');
    } catch (error) {
        console.error('Face verification error:', error.message);
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
};
exports.face_verification = face_verification;


// -------------------------------------Face Recognitions---------------------------------------------------//

exports.createCollection = async (req, res) => {
    try {
        const params = {
            CollectionId: process.env.REKOGNITION_COLLECTION
        };
        await rekognition.createCollection(params).promise();
        return (0, responseHandler_1.handleSuccess)(res, 200, 'Collection created.');
    } catch (err) {
        return (0, responseHandler_1.handleError)(res, 500, err.message);
    }
};

const uploadBufferToS3 = async (buffer, fileName, mimeType) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `faces/${fileName}`,
        Body: buffer,
        ContentType: mimeType,
    };

    const data = await s3.upload(params).promise();
    return {
        s3Url: data.Location,       // Full URL (optional use)
        key: `faces/${fileName}`    // For Rekognition
    };
};

exports.checkUser = async (req, res) => {
    try {
        const user_id = req.user;
        if (!req.file) {
            return res.status(400).json({ error: "Image file is required" });
        }
        const buffer = req.file.buffer;
        const originalName = req.file.originalname;
        const mimeType = req.file.mimetype;
        const fileName = `${Date.now()}_${originalName}`;
        const { key, s3Url } = await uploadBufferToS3(buffer, fileName, mimeType);
        const rekognitionParams = {
            CollectionId: process.env.REKOGNITION_COLLECTION,
            Image: {
                S3Object: {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Name: key,
                },
            },
            MaxFaces: 1,
            FaceMatchThreshold: 90,
        };
        const result = await rekognition.searchFacesByImage(rekognitionParams).promise();

        if (result.FaceMatches.length > 0) {
            const matchedUserId = result.FaceMatches[0].Face.ExternalImageId;
            const similarity = result.FaceMatches[0].Similarity;

            // return res.status(403).json({
            //     message: `Blocked: face matched with banned user ${matchedUserId}`,
            //     similarity,
            // });
            console.log('user_id', user_id.user_id);

            const userRepository = (0, typeorm_1.getRepository)(User_1.User);
            const user = await userRepository.findOneBy({ user_id: user_id.user_id });
            user.face_scan = 1;
            await userRepository.save(user);

            return (0, responseHandler_1.handleSuccess)(res, 200, `Blocked: face matched with banned user ${matchedUserId}`, { isFaceMatched: true, similarity });

        }
        const UsersFaceRepo = (0, typeorm_1.getRepository)(UsersFace_1.UsersFace);
        const UsersFaceEntry = UsersFaceRepo.create({
            user_id: user_id.user_id,
            face_url: s3Url,
        });
        await UsersFaceRepo.save(UsersFaceEntry);
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOneBy({ user_id: user_id.user_id });
        user.face_scan = 0;
        await userRepository.save(user);
        return (0, responseHandler_1.handleSuccess)(res, 200, "No match found. User allowed.", { isFaceMatched: false });
    } catch (err) {
        return (0, responseHandler_1.handleError)(res, 500, err.message);
    }
};




