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
exports.view_profile_image = exports.share_profile_image = exports.comment_on_profile_image = exports.like_unlike_profile_image = void 0;
const joi_1 = __importDefault(require("joi"));
const typeorm_1 = require("typeorm");
const responseHandler_1 = require("../../utils/responseHandler");
const ProfileImage_1 = require("../../entities/ProfileImage");
const like_unlike_profile_image = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const like_unlike_profile_image_schema = joi_1.default.object({
            profile_image_id: joi_1.default.number().required()
        });
        const { error, value } = like_unlike_profile_image_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { profile_image_id } = value;
        const profileImageRepo = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const profileImage = yield profileImageRepo.findOne({ where: { profile_image_id } });
        if (!profileImage) {
            return (0, responseHandler_1.handleError)(res, 404, "Profile image not found");
        }
        if (profileImage.like_count > 0) {
            profileImage.like_count--;
        }
        else {
            profileImage.like_count++;
        }
        yield profileImageRepo.save(profileImage);
        let response_message = profileImage.like_count > 0 ? "Profile image liked successfully" : "Profile image unliked successfully";
        return (0, responseHandler_1.handleSuccess)(res, 200, response_message, profileImage);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.like_unlike_profile_image = like_unlike_profile_image;
const comment_on_profile_image = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const comment_on_profile_image_schema = joi_1.default.object({
            profile_image_id: joi_1.default.number().required(),
            comment: joi_1.default.string().required()
        });
        const { error, value } = comment_on_profile_image_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { profile_image_id, comment } = value;
        const profileImageRepo = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const profileImage = yield profileImageRepo.findOne({ where: { profile_image_id } });
        if (!profileImage) {
            return (0, responseHandler_1.handleError)(res, 404, "Profile image not found");
        }
        profileImage.comment_count++;
        yield profileImageRepo.save(profileImage);
        let response_message = "Comment added successfully";
        return (0, responseHandler_1.handleSuccess)(res, 200, response_message, profileImage);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.comment_on_profile_image = comment_on_profile_image;
const share_profile_image = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const share_profile_image_schema = joi_1.default.object({
            profile_image_id: joi_1.default.number().required()
        });
        const { error, value } = share_profile_image_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { profile_image_id } = value;
        const profileImageRepo = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const profileImage = yield profileImageRepo.findOne({ where: { profile_image_id } });
        if (!profileImage) {
            return (0, responseHandler_1.handleError)(res, 404, "Profile image not found");
        }
        profileImage.share_count++;
        yield profileImageRepo.save(profileImage);
        let response_message = "Profile image shared successfully";
        return (0, responseHandler_1.handleSuccess)(res, 200, response_message, profileImage);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.share_profile_image = share_profile_image;
const view_profile_image = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const view_profile_image_schema = joi_1.default.object({
            profile_image_id: joi_1.default.number().required()
        });
        const { error, value } = view_profile_image_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { profile_image_id } = value;
        const profileImageRepo = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        const profileImage = yield profileImageRepo.findOne({ where: { profile_image_id } });
        if (!profileImage) {
            return (0, responseHandler_1.handleError)(res, 404, "Profile image not found");
        }
        profileImage.view_count++;
        yield profileImageRepo.save(profileImage);
        let response_message = "Profile image viewed successfully";
        return (0, responseHandler_1.handleSuccess)(res, 200, response_message, profileImage);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.view_profile_image = view_profile_image;
