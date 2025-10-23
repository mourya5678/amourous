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
exports.get_feature_list = exports.deletePlanLimits = exports.updatePlanLimits = exports.getPlanLimitsByPlanId = exports.getPlanLimits = exports.setPlanLimits = exports.exportSubscriptionLogs = exports.getSubscriptionAnalytics = exports.getAllUserSubscriptions = exports.deleteSubscriptionPlan = exports.updateSubscriptionPlan = exports.getAllSubscriptionPlans = exports.createSubscriptionPlan = void 0;
const joi_1 = __importDefault(require("joi"));
const dotenv_1 = __importDefault(require("dotenv"));
const typeorm_1 = require("typeorm");
const responseHandler_1 = require("../../utils/responseHandler");
const SubscriptionPlan_1 = require("../../entities/SubscriptionPlan");
const UserSubcription_1 = require("../../entities/UserSubcription");
const PlanLimits_1 = require("../../entities/PlanLimits");
dotenv_1.default.config();
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const createSubscriptionPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            name: joi_1.default.string().required(),
            price: joi_1.default.number().required(),
            durationInDays: joi_1.default.number().required(),
            features: joi_1.default.string().required(),
            isActive: joi_1.default.boolean().optional()
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const subscriptionRepo = (0, typeorm_1.getRepository)(SubscriptionPlan_1.SubscriptionPlan);
        const newPlan = subscriptionRepo.create(value);
        yield subscriptionRepo.save(newPlan);
        return (0, responseHandler_1.handleSuccess)(res, 201, "Subscription plan created successfully", newPlan);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.createSubscriptionPlan = createSubscriptionPlan;
const getAllSubscriptionPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const subscriptionRepo = (0, typeorm_1.getRepository)(SubscriptionPlan_1.SubscriptionPlan);
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        const plans = yield subscriptionRepo.find({
            order: { created_at: "DESC" }
        });
        if (!plans || plans.length === 0) {
            return (0, responseHandler_1.handleError)(res, 404, "No subscription plans found");
        }
        // Get total revenue
        const revenueResult = yield userSubscriptionRepo
            .createQueryBuilder('subscription')
            .select('SUM(subscription.amountPaid)', 'totalRevenue')
            .getRawOne();
        // Get active subscriptions count
        const activeSubscriptions = yield userSubscriptionRepo.count({
            where: {
                status: 'active',
                endDate: (0, typeorm_1.MoreThan)(new Date())
            }
        });
        // Get subscriptions by plan
        const subscriptionsByPlan = yield userSubscriptionRepo
            .createQueryBuilder('subscription')
            .select(['plan.name', 'COUNT(*) as count'])
            .leftJoin('subscription.plan', 'plan')
            .groupBy('plan.name')
            .getRawMany();
        const analytics = {
            plans,
            totalRevenue: revenueResult.totalRevenue || 0,
            activeSubscriptions,
            subscriptionsByPlan
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "Subscription plans fetched successfully", analytics);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getAllSubscriptionPlans = getAllSubscriptionPlans;
const updateSubscriptionPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const schema = joi_1.default.object({
            name: joi_1.default.string().optional(),
            price: joi_1.default.number().optional(),
            durationInDays: joi_1.default.number().optional(),
            features: joi_1.default.string().optional(),
            isActive: joi_1.default.boolean().optional()
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const subscriptionRepo = (0, typeorm_1.getRepository)(SubscriptionPlan_1.SubscriptionPlan);
        const existingPlan = yield subscriptionRepo.findOne({
            where: { subscription_plan_id: Number(id) }
        });
        if (!existingPlan) {
            return (0, responseHandler_1.handleError)(res, 404, "Subscription plan not found");
        }
        Object.assign(existingPlan, value);
        yield subscriptionRepo.save(existingPlan);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Subscription plan updated successfully", existingPlan);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.updateSubscriptionPlan = updateSubscriptionPlan;
const deleteSubscriptionPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const subscriptionRepo = (0, typeorm_1.getRepository)(SubscriptionPlan_1.SubscriptionPlan);
        const existingPlan = yield subscriptionRepo.findOne({
            where: { subscription_plan_id: Number(id) }
        });
        if (!existingPlan) {
            return (0, responseHandler_1.handleError)(res, 404, "Subscription plan not found");
        }
        yield subscriptionRepo.remove(existingPlan);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Subscription plan deleted successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.deleteSubscriptionPlan = deleteSubscriptionPlan;
const getAllUserSubscriptions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        const subscriptions = yield userSubscriptionRepo.find({
            relations: ['user', 'plan'],
            order: {
                created_at: 'DESC'
            }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "User subscriptions fetched successfully", subscriptions);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getAllUserSubscriptions = getAllUserSubscriptions;
const getSubscriptionAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        // Get total revenue
        const revenueResult = yield userSubscriptionRepo
            .createQueryBuilder('subscription')
            .select('SUM(subscription.amountPaid)', 'totalRevenue')
            .getRawOne();
        // Get active subscriptions count
        const activeSubscriptions = yield userSubscriptionRepo.count({
            where: {
                status: 'active',
                endDate: (0, typeorm_1.MoreThan)(new Date())
            }
        });
        // Get subscriptions by plan
        const subscriptionsByPlan = yield userSubscriptionRepo
            .createQueryBuilder('subscription')
            .select(['plan.name', 'COUNT(*) as count'])
            .leftJoin('subscription.plan', 'plan')
            .groupBy('plan.name')
            .getRawMany();
        const analytics = {
            totalRevenue: revenueResult.totalRevenue || 0,
            activeSubscriptions,
            subscriptionsByPlan
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "Subscription analytics fetched successfully", analytics);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getSubscriptionAnalytics = getSubscriptionAnalytics;
const exportSubscriptionLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        const subscriptions = yield userSubscriptionRepo.find({
            relations: ['user', 'plan'],
            order: {
                created_at: 'DESC'
            }
        });
        // Format data for CSV
        const csvData = subscriptions.map(sub => ({
            'Subscription ID': sub.user_subscription_id,
            'User Email': sub.user.email,
            'Plan Name': sub.plan.name,
            'Amount Paid': sub.amountPaid,
            'Transaction ID': sub.transactionId,
            'Payment Method': sub.paymentMethod,
            'Start Date': sub.startDate,
            'End Date': sub.endDate,
            'Status': sub.status,
            'Auto Renew': sub.autoRenew ? 'Yes' : 'No',
            'Created At': sub.created_at
        }));
        // Convert to CSV string
        const fields = Object.keys(csvData[0]);
        const csv = [
            fields.join(','),
            ...csvData.map(row => fields.map(field => JSON.stringify(row[field])).join(','))
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=subscription_logs.csv');
        return res.status(200).send(csv);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.exportSubscriptionLogs = exportSubscriptionLogs;
const setPlanLimits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            subscription_plan_id: joi_1.default.number().required(),
            daily_likes_limit: joi_1.default.number().required(),
            daily_messages_limit: joi_1.default.number().required(),
            daily_sparks_limit: joi_1.default.number().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { subscription_plan_id, daily_likes_limit, daily_messages_limit, daily_sparks_limit } = value;
        const planLimitsRepo = (0, typeorm_1.getRepository)(PlanLimits_1.PlanLimits);
        const planRepo = (0, typeorm_1.getRepository)(SubscriptionPlan_1.SubscriptionPlan);
        const plan = yield planRepo.findOne({
            where: { subscription_plan_id: Number(subscription_plan_id) }
        });
        if (!plan) {
            return (0, responseHandler_1.handleError)(res, 404, "Plan not found");
        }
        const planLimits = planLimitsRepo.create({
            plan,
            daily_likes_limit,
            daily_messages_limit,
            daily_sparks_limit,
        });
        yield planLimitsRepo.save(planLimits);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Plan limits set successfully", planLimits);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.setPlanLimits = setPlanLimits;
const getPlanLimits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const planLimitsRepo = (0, typeorm_1.getRepository)(PlanLimits_1.PlanLimits);
        const planLimits = yield planLimitsRepo.find({
            relations: ['plan'],
            order: {
                created_at: 'DESC'
            }
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Plan limits fetched successfully", planLimits);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getPlanLimits = getPlanLimits;
const getPlanLimitsByPlanId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            subscription_plan_id: joi_1.default.number().required(),
        });
        const { error, value } = schema.validate(req.params);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { subscription_plan_id } = value;
        const planLimitsRepo = (0, typeorm_1.getRepository)(PlanLimits_1.PlanLimits);
        const planLimits = yield planLimitsRepo.findOne({
            where: { plan: { subscription_plan_id: Number(subscription_plan_id) } },
            relations: ['plan']
        });
        if (!planLimits) {
            return (0, responseHandler_1.handleError)(res, 404, "Plan limits not found");
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Plan limits fetched successfully", planLimits);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getPlanLimitsByPlanId = getPlanLimitsByPlanId;
const updatePlanLimits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            plan_limits_id: joi_1.default.number().required(),
            daily_likes_limit: joi_1.default.number().optional().allow(null, ""),
            daily_messages_limit: joi_1.default.number().optional().allow(null, ""),
            daily_sparks_limit: joi_1.default.number().optional().allow(null, ""),
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { plan_limits_id, daily_likes_limit, daily_messages_limit, daily_sparks_limit } = value;
        const planLimitsRepo = (0, typeorm_1.getRepository)(PlanLimits_1.PlanLimits);
        const planLimits = yield planLimitsRepo.findOne({
            where: { plan_limits_id: Number(plan_limits_id) }
        });
        if (!planLimits) {
            return (0, responseHandler_1.handleError)(res, 404, "Plan limits not found");
        }
        if (daily_likes_limit)
            planLimits.daily_likes_limit = daily_likes_limit;
        if (daily_messages_limit)
            planLimits.daily_messages_limit = daily_messages_limit;
        if (daily_sparks_limit)
            planLimits.daily_sparks_limit = daily_sparks_limit;
        yield planLimitsRepo.save(planLimits);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Plan limits updated successfully", planLimits);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.updatePlanLimits = updatePlanLimits;
const deletePlanLimits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            plan_limits_id: joi_1.default.number().required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { plan_limits_id } = value;
        const planLimitsRepo = (0, typeorm_1.getRepository)(PlanLimits_1.PlanLimits);
        const planLimits = yield planLimitsRepo.findOne({
            where: { plan_limits_id: Number(plan_limits_id) }
        });
        if (!planLimits) {
            return (0, responseHandler_1.handleError)(res, 404, "Plan limits not found");
        }
        yield planLimitsRepo.remove(planLimits);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Plan limits deleted successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.deletePlanLimits = deletePlanLimits;
const get_feature_list = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const allFeatures = [
        //     "Register your Amorous account",
        //     "Create private profile",
        //     "Basic search options",
        //     "In-app chat text",
        //     "Send and receive messages (limited)",
        //     "Send likes (limited)",
        //     "Get limited sparks",
        //     "Send and receive unlimited messages",
        //     "Send unlimited likes",
        //     "Unlimited sparks",
        //     "Read receipts",
        //     "Search for members",
        //     "Browse profiles",
        //     "More top personalized matches",
        //     "Send likes",
        //     "Custom profile image silhouette",
        //     "See profile likes",
        //     "Send photos in chat",
        //     "Send games in chat",
        //     "Message read receipts",
        //     "Advanced search options",
        //     "Unlimited matches and likes",
        //     "Secure in-app voice and video calling"
        // ];
        const featureList = [
            { name: "Register your Amorous account" },
            { name: "Create private profile" },
            { name: "Basic search options" },
            // { name: "In-app chat text" },
            {
                name: "Send messages",
                option: {
                    option1: "Send messages (limited)",
                    option2: "Send messages (unlimited)",
                }
            },
            // {
            //     name: "Send and receive messages",
            //     option: {
            //         option1: "Send and receive messages (limited)",
            //         option2: "Send and receive messages (unlimited)",
            //     }
            // },
            {
                name: "Send likes",
                option: {
                    option1: "Send likes (limited)",
                    option2: "Send likes (unlimited)",
                }
            },
            {
                name: "Send sparks",
                option: {
                    option1: "Send sparks (limited)",
                    option2: "Send sparks (unlimited)",
                }
            },
            {
                name: "Read receipts",
            },
            {
                name: "Search for members",
            },
            {
                name: "Browse profiles",
            },
            {
                name: "More top personalized matches",
            },
            {
                name: "Custom profile image silhouette",
            },
            {
                name: "See profile likes",
            },
            {
                name: "Send photos in chat",
            },
            {
                name: "Message read receipts",
            },
            {
                name: "Advanced search options",
            },
            {
                name: "Unlimited matches and likes",
            },
            {
                name: "Secure in-app voice and video calling",
            }
        ];
        return (0, responseHandler_1.handleSuccess)(res, 200, "Feature list fetched successfully", featureList);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_feature_list = get_feature_list;
