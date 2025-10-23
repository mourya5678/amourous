"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aws_s3_1 = require("../utils/aws.s3");
const auth_1 = require("../middlewares/auth");
//==================================== Import Controller ==============================
const authControllers = __importStar(require("../controllers/admin/authController"));
const userControllers = __importStar(require("../controllers/admin/userController"));
const discoverQuestionControllers = __importStar(require("../controllers/admin/discoverQuestionController"));
const contentManagements = __importStar(require("../controllers/admin/contentManagement"));
const reviewControllers = __importStar(require("../controllers/admin/reviewController"));
const callLogsControllers = __importStar(require("../controllers/admin/callLogsController"));
const subscriptionControllers = __importStar(require("../controllers/admin/subscriptionController"));
const pollControllers = __importStar(require("../controllers/admin/pollController"));
const chatControllers = __importStar(require("../controllers/admin/chatController"));
const router = express_1.default.Router();
//==================================== Auth ==============================
router.post("/register", authControllers.register_admin);
router.get("/verify-email", authControllers.verifyEmail);
router.post("/login", authControllers.login_admin);
router.post("/forgot-password", authControllers.forgot_password);
router.get("/reset-password", authControllers.render_forgot_password_page);
router.post("/reset-password", authControllers.reset_password);
router.post("/change-password", auth_1.authenticateAdmin, authControllers.changePassword);
router.get("/profile", auth_1.authenticateAdmin, authControllers.getProfile);
router.post("/profile/update", auth_1.authenticateAdmin, aws_s3_1.upload.single('file'), authControllers.updateProfile);
router.get("/register-success", authControllers.render_success_register);
router.get("/success-reset", authControllers.render_success_reset);
router.get("/dashboard-details", authControllers.dashboard_details);
//==================================== USER ==============================
router.get("/user-list", auth_1.authenticateAdmin, userControllers.get_all_user_list);
router.post("/get-user-report-by-id", auth_1.authenticateAdmin, userControllers.get_user_report_by_id);
router.post("/change-user-status", auth_1.authenticateAdmin, userControllers.change_user_status);
//==================================== Discover Question ==============================
router.post("/add-discover-question", discoverQuestionControllers.createDiscoverQuestion);
router.get("/get-all-discover-questions", discoverQuestionControllers.getAllDiscoverQuestions);
router.get("/get-discover-question-by-id", discoverQuestionControllers.getDiscoverQuestionById);
router.post("/update-discover-question-by-id", discoverQuestionControllers.updateDiscoverQuestion);
//==================================== Content Management ==============================
router.post("/create-content", contentManagements.createContent);
router.post("/get-contents", contentManagements.get_contents);
router.post("/update-content", contentManagements.updateContent);
//==================================== Review ==============================
router.get("/get-all-app-review", reviewControllers.get_all_app_review);
//==================================== Call Logs ==============================
router.get("/get-call-logs", callLogsControllers.getCallLogs);
router.delete("/delete-call-log/:id", callLogsControllers.deleteCallLog);
//==================================== Subscription ==============================
router.post("/create-subscription-plan", subscriptionControllers.createSubscriptionPlan);
router.get("/get-all-subscription-plans", subscriptionControllers.getAllSubscriptionPlans);
router.put("/update-subscription-plan/:id", subscriptionControllers.updateSubscriptionPlan);
router.delete("/delete-subscription-plan/:id", subscriptionControllers.deleteSubscriptionPlan);
router.get("/get-all-user-subscriptions", subscriptionControllers.getAllUserSubscriptions);
router.get("/get-subscription-analytics", subscriptionControllers.getSubscriptionAnalytics);
router.get("/export-subscription-logs", subscriptionControllers.exportSubscriptionLogs);
//==================================== Poll ==============================
router.post("/create-poll", auth_1.authenticateAdmin, pollControllers.create_poll);
router.get("/get-all-polls", auth_1.authenticateAdmin, pollControllers.get_all_polls);
router.put("/update-poll", auth_1.authenticateAdmin, pollControllers.update_poll);
router.delete("/delete-poll", auth_1.authenticateAdmin, pollControllers.delete_poll);
//==================================== Plan Limits ==============================
router.post("/set-plan-limits", auth_1.authenticateAdmin, subscriptionControllers.setPlanLimits);
router.get("/get-plan-limits", auth_1.authenticateAdmin, subscriptionControllers.getPlanLimits);
router.get("/get-plan-limits-by-plan-id/:subscription_plan_id", auth_1.authenticateAdmin, subscriptionControllers.getPlanLimitsByPlanId);
router.put("/update-plan-limits", auth_1.authenticateAdmin, subscriptionControllers.updatePlanLimits);
router.delete("/delete-plan-limits", auth_1.authenticateAdmin, subscriptionControllers.deletePlanLimits);
//==================================== Feature List ==============================
router.get("/get-feature-list", subscriptionControllers.get_feature_list);
//==================================== Chat ==============================
router.get("/get-all-reported-messages", auth_1.authenticateAdmin, chatControllers.get_all_reported_messages);

// --------------------------------------approved documents---------------------------------------//
router.get("/fetch-all-users-documents", auth_1.authenticateAdmin, userControllers.fetch_all_users_documents);
router.get("/views-users-documents", auth_1.authenticateAdmin, userControllers.views_users_documents);
router.post("/approved-goverments-documents", auth_1.authenticateAdmin, userControllers.approved_documents);
router.get("/get-all-contact-supports", auth_1.authenticateAdmin, userControllers.get_all_contact_supports);


exports.default = router;
