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
exports.getCurrentSubscription = exports.getUserSubscriptions = exports.purchaseSubscription = exports.getSubscriptionPlans = void 0;
const joi_1 = __importDefault(require("joi"));
const dotenv_1 = __importDefault(require("dotenv"));
const typeorm_1 = require("typeorm");
const responseHandler_1 = require("../../utils/responseHandler");
const SubscriptionPlan_1 = require("../../entities/SubscriptionPlan");
const UserSubcription_1 = require("../../entities/UserSubcription");
dotenv_1.default.config();
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const getSubscriptionPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const planRepository = (0, typeorm_1.getRepository)(SubscriptionPlan_1.SubscriptionPlan);
        const plans = yield planRepository.find({
            where: { isActive: true },
            order: { price: 'ASC' }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Subscription plans fetched successfully", plans);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getSubscriptionPlans = getSubscriptionPlans;
const purchaseSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const subscriptionSchema = joi_1.default.object({
            plan_id: joi_1.default.number().required(),
            payment_method: joi_1.default.string().required(),
            transaction_id: joi_1.default.string().required(),
            amount_paid: joi_1.default.number().required(),
            auto_renew: joi_1.default.boolean().default(false)
        });
        const { error, value } = subscriptionSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { plan_id, payment_method, transaction_id, amount_paid, auto_renew } = value;
        const planRepository = (0, typeorm_1.getRepository)(SubscriptionPlan_1.SubscriptionPlan);
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        const subscription = yield userSubscriptionRepo.findOne({ where: { user: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id }, isActive: true }, relations: ['plan'] });
        if (subscription) {
            if (plan_id < subscription.plan.subscription_plan_id) {
                return (0, responseHandler_1.handleError)(res, 400, "You cannot downgrade your subscription");
            }
            else {
                subscription.isActive = false;
                yield userSubscriptionRepo.save(subscription);
            }
        }
        // Find the subscription plan
        const plan = yield planRepository.findOne({ where: { subscription_plan_id: plan_id, isActive: true } });
        if (!plan)
            return (0, responseHandler_1.handleError)(res, 404, "Subscription plan not found or inactive");
        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationInDays);
        // Create new subscription
        const newSubscription = userSubscriptionRepo.create({
            user: req.user,
            plan: plan,
            startDate,
            endDate,
            isActive: true,
            amountPaid: amount_paid,
            transactionId: transaction_id,
            paymentMethod: payment_method,
            autoRenew: auto_renew,
            status: 'active'
        });
        yield userSubscriptionRepo.save(newSubscription);
        return (0, responseHandler_1.handleSuccess)(res, 201, "Subscription purchased successfully", newSubscription);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.purchaseSubscription = purchaseSubscription;
const getUserSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        const subscriptions = yield userSubscriptionRepo.find({
            where: { user: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id } },
            relations: ['plan'],
            order: { created_at: 'DESC' }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "User subscriptions fetched successfully", subscriptions);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getUserSubscriptions = getUserSubscriptions;
const getCurrentSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        const subscription = yield userSubscriptionRepo.findOne({ where: { user: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id }, isActive: true }, relations: ['plan'] });
        if (!subscription)
            return (0, responseHandler_1.handleError)(res, 404, "No active subscription found");
        return (0, responseHandler_1.handleSuccess)(res, 200, "Current subscription fetched successfully", subscription);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getCurrentSubscription = getCurrentSubscription;
