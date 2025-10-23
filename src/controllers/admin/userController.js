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
exports.change_user_status = exports.get_user_report_by_id = exports.get_all_user_list = void 0;
const joi_1 = __importDefault(require("joi"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../../entities/User");
const typeorm_1 = require("typeorm");
const UserAnswer_1 = require("../../entities/UserAnswer");
const UserReport_1 = require("../../entities/UserReport");
const ProfileImage_1 = require("../../entities/ProfileImage");
const ProfileStuff_1 = require("../../entities/ProfileStuff");
const UserSubcription_1 = require("../../entities/UserSubcription");
const UsersFace_1 = require("../../entities/UsersFace");
const responseHandler_1 = require("../../utils/responseHandler");
const firebaseUser_1 = require("../../notificaion/firebaseUser");
const Notification_1 = require("../../entities/Notification");
const UsersVerificationDocuments_1 = require("../../entities/UsersVerificationDocuments");

dotenv_1.default.config();
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const ContactSupport_1 = require("../../entities/ContactSupport");
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


const get_all_user_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const userReportRepo = (0, typeorm_1.getRepository)(UserReport_1.UserReport);
        const profileImageRepo = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const profileStuffRepo = (0, typeorm_1.getRepository)(ProfileStuff_1.ProfileStuff);
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        const user_list = yield userRepository.find({ where: { is_test_completed: true }, order: { created_at: "DESC" } });
        if (!user_list || user_list.length === 0) {
            return (0, responseHandler_1.handleError)(res, 404, "Users Not Found");
        }
        const updatedUsers = yield Promise.all(user_list.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b;
            if (user.profile_image && !user.profile_image.startsWith('http')) {
                user.profile_image = APP_URL + user.profile_image;
            }
            const subscription_type = yield userSubscriptionRepo.find({
                where: { user: { user_id: user.user_id } },
                relations: ['plan'],
                order: { created_at: 'DESC' }
            });

            // Fetch user report and calculate average personality profile percentage
            const user_report = yield userReportRepo.find({
                where: { user: { user_id: user.user_id } },
                relations: ["user"]
            });

            let personality_profile_percentage = null;
            if (user_report.length > 0) {
                const total_score = user_report.reduce((sum, report) => sum + Number(report.percentage), 0);
                personality_profile_percentage = (total_score / user_report.length).toFixed(2);
            }

            // Fetch user's profile images
            let profile_images = yield profileImageRepo.find({ where: { user: { user_id: user.user_id } } });
            profile_images = profile_images.map((img) => ({
                ...img,
                image: img.image && !img.image.startsWith("http") ? `${APP_URL}${img.image}` : img.image
            }));

            // Fetch and count profile stuff
            const stuff = yield profileStuffRepo.find({ where: { recipient: { user_id: user.user_id } } });
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

            // Fetch user's face scan
            const UsersFaceRepository = (0, typeorm_1.getRepository)(UsersFace_1.UsersFace);
            const userFace = yield UsersFaceRepository.findOneBy({ user_id: user.user_id });
            console.log('userFace', userFace);

            // Corrected face_url logic
            let face_url = userFace != null ? 1 : 0;
            // let subscriptionaaa_type = subscription_type[0];
            // console.log('subscriptionaaa_type', subscriptionaaa_type);
            // Return enriched user data
            return {
                ...user,
                subscription_type: ((_b = (_a = subscription_type[0]) === null || _a === void 0 ? void 0 : _a.plan) === null || _b === void 0 ? void 0 : _b.name) || null,
                // subscription_type: subscriptionaaa_type,
                personality_profile_percentage,
                profile_images,
                stuff: stuffCount,
                face_url
            };
        })));

        const filteredUsers = updatedUsers.filter(user => user.face_url === 1);

        return (0, responseHandler_1.handleSuccess)(res, 200, `Users Fetched Successfully.`, filteredUsers);

    }
    catch (error) {
        console.error('Error in get_all_user_list:', error);
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_all_user_list = get_all_user_list;
const get_user_report_by_id = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            user_id: joi_1.default.number().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { user_id } = value;
        const userReportRepo = (0, typeorm_1.getRepository)(UserReport_1.UserReport);
        const UserAnswerReportRepo = (0, typeorm_1.getRepository)(UserAnswer_1.UserAnswer);
        const user_report = yield userReportRepo.find({
            where: { user: { user_id: user_id } },
            relations: ["user"],
        });
        if (!user_report || user_report.length === 0) {
            return (0, responseHandler_1.handleError)(res, 404, "User Report Not Found");
        }
        const user_answers = yield UserAnswerReportRepo.find({
            where: { user: { user_id: user_id } },
            relations: ["question", "user"],
        });
        if (!user_answers || user_answers.length === 0) {
            return (0, responseHandler_1.handleError)(res, 404, "User Answer Not Found");
        }
        const total_score = user_report.reduce((acc, report) => acc + Number(report.percentage), 0);
        const user_report_count = user_report.length;
        const categoryScores = {
            Love: { achieved: 0, total: 0 },
            Adventure: { achieved: 0, total: 0 },
            Emotional: { achieved: 0, total: 0 },
            Trust: { achieved: 0, total: 0 },
            Happiness: { achieved: 0, total: 0 },
        };
        user_answers.forEach((answer) => {
            var _a, _b;
            const category = (_a = answer.question) === null || _a === void 0 ? void 0 : _a.question_category;
            if (category && categoryScores.hasOwnProperty(category)) {
                categoryScores[category].achieved += answer.achieved_score || 0;
                categoryScores[category].total += ((_b = answer.question) === null || _b === void 0 ? void 0 : _b.totol_score) || 0;
            }
        });
        const category_scores_percentage = {};
        Object.entries(categoryScores).forEach(([key, value]) => {
            if (value.total > 0) {
                category_scores_percentage[key] = Number(((value.achieved / value.total) * 100).toFixed(2));
            }
            else {
                category_scores_percentage[key] = 0;
            }
        });
        const data = {
            personality_profile_percentage: (total_score / user_report_count).toFixed(2),
            user_report,
            key_strength: category_scores_percentage,
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "User Report Retrieved Successfully", data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_user_report_by_id = get_user_report_by_id;


// const change_user_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
//     try {
//         let response_message = null;
//         const changeStatusSchema = joi_1.default.object({
//             user_id: joi_1.default.number().required(),
//             is_active: joi_1.default.boolean().required()
//         });
//         const { error, value } = changeStatusSchema.validate(req.body);
//         if (error)
//             return (0, responseHandler_1.joiErrorHandle)(res, error);
//         const { user_id, is_active } = value;
//         const userRepository = (0, typeorm_1.getRepository)(User_1.User);
//         const user = yield userRepository.findOneBy({ user_id: user_id });
//         if (!user) {
//             return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
//         }
//         user.is_active = is_active;
//         if (!is_active) {
//             response_message = "User Deactivated Successfully";
//         }
//         else {
//             response_message = "User Activated Successfully";
//         }
//         yield userRepository.save(user);
//         return (0, responseHandler_1.handleSuccess)(res, 200, response_message);
//     }
//     catch (error) {
//         console.error('Error in register:', error);
//         return (0, responseHandler_1.handleError)(res, 500, error.message);
//     }
// });
// exports.change_user_status = change_user_status;


const change_user_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const changeStatusSchema = joi_1.default.object({
            user_id: joi_1.default.number().required(),
            is_active: joi_1.default.boolean().required()
        });
        const { error, value } = changeStatusSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { user_id, is_active } = value;

        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const userFaceRepo = (0, typeorm_1.getRepository)(UsersFace_1.UsersFace);
        const user = yield userRepository.findOneBy({ user_id: user_id });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        }

        const userFace = yield userFaceRepo.findOneBy({ user_id });
        if (!userFace) {
            return (0, responseHandler_1.handleError)(res, 404, "User Face Not Found");
        }
        const faceUrl = userFace.face_url;
        const faceKey = faceUrl.split("/").slice(-2).join("/");
        if (!is_active) {
            const rekogParams = {
                CollectionId: process.env.REKOGNITION_COLLECTION,
                Image: {
                    S3Object: {
                        Bucket: process.env.S3_BUCKET_NAME,
                        Name: faceKey,
                    },
                },
                ExternalImageId: String(user_id),
                DetectionAttributes: [],
            };

            const indexResult = yield rekognition.indexFaces(rekogParams).promise();

            if (indexResult.FaceRecords.length === 0) {
                return (0, responseHandler_1.handleError)(res, 404, "No face detected to ban.");
            }

            const rekogFaceId = indexResult.FaceRecords[0].Face.FaceId;

            // Save Rekognition FaceId to DB for unban later
            userFace.rekognition_face_id = rekogFaceId;
            yield userFaceRepo.save(userFace);

            user.is_active = is_active;
            yield userRepository.save(user);
            return (0, responseHandler_1.handleSuccess)(res, 200, "User banned successfully.");
        } else {

            const rekogFaceId = userFace.rekognition_face_id;
            if (rekogFaceId) {
                const deleteParams = {
                    CollectionId: process.env.REKOGNITION_COLLECTION,
                    FaceIds: [rekogFaceId],
                };
                yield rekognition.deleteFaces(deleteParams).promise();
            }

            // Clear RekogFaceId from DB
            userFace.rekognition_face_id = null;
            yield userFaceRepo.save(userFace);

            user.is_active = is_active;
            yield userRepository.save(user);
            return (0, responseHandler_1.handleSuccess)(res, 200, "User unbanned successfully.");
        }
    } catch (err) {
        console.error('Error in register:', err);
        return (0, responseHandler_1.handleError)(res, 500, err.message);
    }
});
exports.change_user_status = change_user_status;

exports.approved_documents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const changeStatusSchema = joi_1.default.object({
            user_id: joi_1.default.number().required(),
            document_verified: joi_1.default.number().required()
        });
        const { error, value } = changeStatusSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { user_id, document_verified } = value;
        const NotificationRepo = (0, typeorm_1.getRepository)(Notification_1.Notification);
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOneBy({ user_id: user_id });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        }
        console.log('document_verified', document_verified);

        user.is_documents_verified = document_verified;
        console.log('user', user);

        yield userRepository.save(user);
        let response_message;
        if (document_verified == 1) {
            response_message = "Government documents has been successfully verified.";
        }
        else {
            response_message = "Government documents verification has been rejected.";
        }

        let notification_title = document_verified === 1
            ? `Your documents have been approved by the admin`
            : `Your documents have been rejected by the admin`;

        let notification_message = document_verified === 1
            ? `Your documents were successfully verified and approved by the admin.`
            : `Your documents were reviewed and rejected by the admin. Please resubmit valid documents.`;
        const user_data = yield userRepository.findOne({ where: { user_id: user_id } });
        // if (user_data.is_push_notification_on) {
        yield (0, firebaseUser_1.sendNotificationUser)(user_data.fcm_token, notification_title, notification_message, { notification_type: document_verified == 1 ? "identificationApproved" : "identificationReject" });
        // }
        let newNotification = NotificationRepo.create({
            recipient: user_data,
            notification_type: document_verified == 1 ? "identificationApproved" : "identificationReject",
            sender: req.user,
            notificaton_title: notification_title,
            notification_message: notification_message,
        })
        yield NotificationRepo.save(newNotification);

        return (0, responseHandler_1.handleSuccess)(res, 200, response_message);
    } catch (err) {
        console.error('Error in register:', err);
        return (0, responseHandler_1.handleError)(res, 500, err.message);
    }
});

exports.get_all_contact_supports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contactSupportRepo = (0, typeorm_1.getRepository)(ContactSupport_1.ContactSupport);
        const supportEntries = yield contactSupportRepo.find({
            relations: ["user_id"],
            order: { createdAt: "DESC" },
        });
        if (!supportEntries || supportEntries.length === 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "No contact support entries found", []);
        }
        const responseData = supportEntries.map(entry => ({
            id: entry.id,
            user_id: entry.user_id.user_id,
            email: entry.email,
            phone_number: entry.phone_number,
            message: entry.message,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            full_name: entry.user_id.full_name,
            profile_image: entry.user_id.profile_image
        }));
        return (0, responseHandler_1.handleSuccess)(res, 200, "Contact support data fetched successfully", responseData);

    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});


exports.fetch_all_users_documents = async (req, res) => {
    try {
        const userRepo = (0, typeorm_1.getRepository)(User_1.User);
        const docRepo = (0, typeorm_1.getRepository)(UsersVerificationDocuments_1.UsersVerificationDocuments);
        const unverifiedUsers = await userRepo.find({
            where: { is_documents_verified: typeorm_1.Not(3) },
            order: { created_at: "DESC" },
        });

        if (!unverifiedUsers || unverifiedUsers.length === 0) {
            return handleSuccess(res, 200, "No unverified users found", []);
        }
        const userIds = unverifiedUsers.map(user => user.user_id);

        const userDocs = await docRepo.find({
            where: { user_id: typeorm_1.In(userIds) },
            order: { createdAt: "DESC" },
        });
        const docMap = new Map();
        userDocs.forEach(doc => {
            if (!docMap.has(doc.user_id)) {
                docMap.set(doc.user_id, doc.createdAt);
            }
        });
        const responseData = unverifiedUsers.map(user => ({
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            phone_number: user.phone_number,
            is_documents_verified: user.is_documents_verified,
            createdAt: docMap.get(user.user_id) || null,
        }));

        return (0, responseHandler_1.handleSuccess)(res, 200, "Unverified users with document dates fetched successfully", responseData);
    } catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
};

exports.views_users_documents = async (req, res) => {
    try {
        let { userId } = req.query;
        const docRepo = (0, typeorm_1.getRepository)(UsersVerificationDocuments_1.UsersVerificationDocuments);

        const userDocs = await docRepo.find({
            where: { user_id: userId },
        });

        const documentImages = userDocs.map(doc => doc.goverment_docs);

        const userRepo = (0, typeorm_1.getRepository)(User_1.User);
        const unverifiedUsers = await userRepo.find({
            where: { user_id: userId }
        });
        const responseData = {
            user_id: parseInt(userId),
            user_document_image: documentImages,
            full_name: unverifiedUsers[0].full_name,
            email: unverifiedUsers[0].email,
            phone_number: unverifiedUsers[0].mobile_number,
            is_documents_verified: unverifiedUsers[0].is_documents_verified,
            createdAt: userDocs[0].createdAt,
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "User documents fetched successfully", responseData);
    } catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
};

