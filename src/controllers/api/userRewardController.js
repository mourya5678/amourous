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
exports.get_my_rewards = void 0;
const typeorm_1 = require("typeorm");
const responseHandler_1 = require("../../utils/responseHandler");
const UserReward_1 = require("../../entities/UserReward");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const get_my_rewards = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userRewardRepo = (0, typeorm_1.getRepository)(UserReward_1.UserReward);
        const user_reward = yield userRewardRepo.find({
            where: { user: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id }, points_awarded: (0, typeorm_1.Not)(0) },
            relations: ["user", "with_user", "poll"],
        });
        if (user_reward.length === 0) {
            const final_data = {
                total_reward_points: 0,
                rewards: [],
                grouped_rewards: [],
            };
            return (0, responseHandler_1.handleSuccess)(res, 200, "Rewards fetched successfully", final_data);
        }
        const grouped = {};
        user_reward.forEach((reward) => {
            var _a;
            if ((reward === null || reward === void 0 ? void 0 : reward.user) && (reward === null || reward === void 0 ? void 0 : reward.with_user)) {
                const key = `${reward.user.user_id}-${reward.with_user.user_id}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        user_id: reward.user.user_id,
                        with_user_id: reward.with_user.user_id,
                        with_user_name: reward.with_user.full_name,
                        total_winning_score: 0,
                    };
                }
                grouped[key].total_winning_score += Number(((_a = reward.poll) === null || _a === void 0 ? void 0 : _a.winning_score) || 0);
            }
        });
        const grouped_rewards = Object.values(grouped);
        const total_reward = grouped_rewards.reduce((sum, item) => sum + item.total_winning_score, 0);
        const final_data = {
            total_reward_points: total_reward,
            // rewards: user_reward,       // full list of rewards with all details
            grouped_rewards, // array of grouped rewards by with_user_id with totals
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "Rewards fetched successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_my_rewards = get_my_rewards;
