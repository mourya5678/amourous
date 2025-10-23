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
exports.get_block_list = exports.block_unblock_user = void 0;
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../../entities/User");
const typeorm_1 = require("typeorm");
const BlockedUser_1 = require("../../entities/BlockedUser");
const responseHandler_1 = require("../../utils/responseHandler");
const socket_1 = require("../../utils/socket");
const app_1 = require("../../../app");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const block_unblock_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        let block_unblock_user_schema = joi_1.default.object({
            blocked_id: joi_1.default.number().required(),
            is_blocked: joi_1.default.boolean().required()
        });
        const { error, value } = block_unblock_user_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { blocked_id, is_blocked } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const blockUserRepo = (0, typeorm_1.getRepository)(BlockedUser_1.BlockedUser);
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id) == blocked_id) {
            return (0, responseHandler_1.handleError)(res, 400, "You Can Not Block Your Self");
        }
        const user_data = yield userRepository.findOne({ where: { user_id: blocked_id } });
        if (!user_data)
            return (0, responseHandler_1.handleError)(res, 404, "blocked id User Not Found");
        const block_data = yield blockUserRepo.findOne({ where: { blocker: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id }, blocked: { user_id: blocked_id } } });
        if (!block_data) {
            const newBlock = blockUserRepo.create({
                blocker: req.user,
                blocked: user_data,
                is_blocked: is_blocked
            });
            yield blockUserRepo.save(newBlock);
        }
        else {
            if (block_data.is_blocked == true && is_blocked == true) {
                return (0, responseHandler_1.handleError)(res, 400, "You Have Already Blocked this User ");
            }
            if (block_data.is_blocked == false && is_blocked == false) {
                return (0, responseHandler_1.handleError)(res, 400, "You Have Already Un-Blocked this User ");
            }
            block_data.is_blocked = is_blocked;
            yield blockUserRepo.save(block_data);
        }
        let user_id = (_c = req.user) === null || _c === void 0 ? void 0 : _c.user_id;
        let target_user_id = blocked_id;
        if (user_id && target_user_id) {
            yield (0, socket_1.handleBlockUnblockUserStatus)(app_1.io)({ user_id, target_user_id });
        }
        let response_message = is_blocked == true ? "Blocked" : "Un-Blocked";
        return (0, responseHandler_1.handleSuccess)(res, 200, `User ${response_message} Successfully`);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.block_unblock_user = block_unblock_user;
const get_block_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            return (0, responseHandler_1.handleError)(res, 400, "User ID is required.");
        }
        const blockUserRepo = (0, typeorm_1.getRepository)(BlockedUser_1.BlockedUser);
        let block_list = yield blockUserRepo.find({
            where: { blocker: { user_id }, is_blocked: true },
            relations: ["blocked"],
            order: { blocked_at: "DESC" }
        });
        if (block_list.length == 0) {
            return (0, responseHandler_1.handleSuccess)(res, 200, "Blocked List Retrieved Successfully", []);
        }
        ;
        let final_data = yield Promise.all(block_list.map((block_user) => {
            if (block_user.blocked.profile_image && !block_user.blocked.profile_image.startsWith("http")) {
                block_user.blocked.profile_image = `${APP_URL}${block_user.blocked.profile_image}`;
            }
            return Object.assign({}, block_user);
        }));
        return (0, responseHandler_1.handleSuccess)(res, 200, "Blocked List Retrieved Successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "An unexpected error occurred.");
    }
});
exports.get_block_list = get_block_list;
