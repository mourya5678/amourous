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
exports.get_all_app_review = void 0;
const typeorm_1 = require("typeorm");
const AppReview_1 = require("../../entities/AppReview");
const responseHandler_1 = require("../../utils/responseHandler");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const get_all_app_review = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
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
        return (0, responseHandler_1.handleSuccess)(res, 200, "App Review List Retrieved Successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_all_app_review = get_all_app_review;
