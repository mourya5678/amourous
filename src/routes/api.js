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
//==================================== Import Controllers ==============================
const authControllers = __importStar(require("../controllers/api/authController"));
const userControllers = __importStar(require("../controllers/api/userController"));
const chatControllers = __importStar(require("../controllers/api/chatController"));
const reviewControllers = __importStar(require("../controllers/api/reviewController"));
const callLogsControllers = __importStar(require("../controllers/api/callLogsController"));
const blockUserControllers = __importStar(require("../controllers/api/blockUserController"));
const notificationControllers = __importStar(require("../controllers/api/notificationController"));
const subscriptionControllers = __importStar(require("../controllers/api/subscriptionController"));
const profileStuffControllers = __importStar(require("../controllers/api/profileStuffController"));
const discoverQuestionControllers = __importStar(require("../controllers/api/discoverQuestionController"));
const userRewardControllers = __importStar(require("../controllers/api/userRewardController"));
const pollControllers = __importStar(require("../controllers/api/pollController"));
const router = express_1.default.Router();
//==================================== AUTH ==============================
router.post("/register-with-email", authControllers.register_with_email);
router.post("/login-with-mobile", authControllers.login_with_mobile);
router.post("/login-with-otp", authControllers.login_with_otp);
router.get("/verify-email", authControllers.verifyEmail);
router.post("/login-with-email", authControllers.login_with_email);
router.post("/social-login", authControllers.social_login);
router.post("/forgot-password", authControllers.forgot_password);
router.get("/reset-password", authControllers.render_forgot_password_page);
router.get("/terms-and-conditions", authControllers.render_terms_and_condition);
router.get("/privacy-policy", authControllers.render_privacy_policy);
router.post("/reset-password", authControllers.reset_password);
router.post("/change-password", auth_1.authenticateUser, authControllers.changePassword);
// router.post("/profile/update", authenticateUser, upload.single('file'), authControllers.updateProfile);
router.post("/profile/update", auth_1.authenticateUser, aws_s3_1.uploadToMemory.single('file'), authControllers.updateProfile);
router.post("/update-photos", auth_1.authenticateUser, aws_s3_1.upload.array('files', 10), authControllers.update_photos);
router.post("/delete-profile-photos", auth_1.authenticateUser, authControllers.delete_profile_photos);
router.post("/update-preferences", auth_1.authenticateUser, authControllers.update_preferences);
router.get("/register-success", authControllers.render_success_register);
router.get("/success-reset", authControllers.render_success_reset);
router.delete("/delete-account", auth_1.authenticateUser, authControllers.deleteAccount);
router.post("/online-offline-user", auth_1.authenticateUser, authControllers.online_offline_user);
//==================================== Discover Question & Answer ==============================
router.get("/get-question-by-discover", auth_1.authenticateUser, discoverQuestionControllers.getDiscoverQuestionByDiscover);
router.get("/discover-question-overview", auth_1.authenticateUser, discoverQuestionControllers.discover_question_overview);
router.post("/is-correct-answer", auth_1.authenticateUser, discoverQuestionControllers.is_correct_answer);
router.post("/submit-question-report", auth_1.authenticateUser, discoverQuestionControllers.submit_question_report);
router.get("/get-user-report", auth_1.authenticateUser, discoverQuestionControllers.get_user_report);
router.post("/add-update-user-answer", auth_1.authenticateUser, discoverQuestionControllers.add_update_user_answer);
router.post("/get-user-answer", auth_1.authenticateUser, discoverQuestionControllers.get_user_answers);
//==================================== User ==============================
router.get("/find-your-match", auth_1.authenticateUser, userControllers.find_your_match);
router.get("/home-page-match", auth_1.authenticateUser, userControllers.home_page_match_api);
router.get("/get-slider-users", auth_1.authenticateUser, userControllers.get_slider_user);
router.get("/profile", auth_1.authenticateUser, userControllers.get_user_by_id);
//==================================== Friend Request ==============================
router.post("/send-friend-request", auth_1.authenticateUser, userControllers.send_friend_request);
router.get("/get-request-list", auth_1.authenticateUser, userControllers.get_request_list);
router.post("/accept-reject-request", auth_1.authenticateUser, userControllers.accept_reject_request);
router.get("/get-friends", auth_1.authenticateUser, userControllers.getFriends);
router.post("/remove-friend", auth_1.authenticateUser, userControllers.remove_friend);
//==================================== Block Unblock ==============================
router.post("/block-unblock-user", auth_1.authenticateUser, blockUserControllers.block_unblock_user);
router.get("/get-block-list", auth_1.authenticateUser, blockUserControllers.get_block_list);
//==================================== Stuff ==============================
router.post("/send-stuff-to-user", auth_1.authenticateUser, profileStuffControllers.send_stuff_to_user);
//==================================== Review ==============================
router.post("/send-review", auth_1.authenticateUser, reviewControllers.send_review);
router.get("/get-all-review", auth_1.authenticateUser, reviewControllers.get_all_review);
//==================================== App Review ==============================
router.post("/send-app-review", auth_1.authenticateUser, reviewControllers.send_app_review);
router.post("/get-all-app-review", auth_1.authenticateUser, reviewControllers.get_all_app_review);
//==================================== Like Unlike & Spark  ==============================
router.post("/like-unlike-user", auth_1.authenticateUser, userControllers.like_unlike_user);
router.get("/my-favorites", auth_1.authenticateUser, userControllers.MyFavorites);
router.post("/send-spark", auth_1.authenticateUser, userControllers.send_spark);
router.post("/not-interested", auth_1.authenticateUser, userControllers.not_interested_user);
//==================================== Notifications ==============================
router.get("/get-user-notification", auth_1.authenticateUser, notificationControllers.get_user_notification);
router.get("/get-match-notification", auth_1.authenticateUser, notificationControllers.get_match_notfication);
router.get("/get-like-notification", auth_1.authenticateUser, notificationControllers.get_like_notfication);
router.get("/get-spark-notification", auth_1.authenticateUser, notificationControllers.get_spark_notfication);
router.get("/get-review-notification", auth_1.authenticateUser, notificationControllers.get_review_notfication);
router.post("/send-call-notification", auth_1.authenticateUser, notificationControllers.send_notification_on_call);
router.delete("/delete-notification", auth_1.authenticateUser, notificationControllers.delete_notification);
router.delete("/delete-all-notification", auth_1.authenticateUser, notificationControllers.delete_all_notification);
//==================================== Chat ==============================
router.post("/get-chat-messages", auth_1.authenticateUser, chatControllers.get_message_by_chat);
router.post("/get-chat-messages-by-users", auth_1.authenticateUser, chatControllers.get_message_by_users);
router.get("/get-unread-users-count", auth_1.authenticateUser, chatControllers.get_unread_users_count);
router.post("/upload-media-files", aws_s3_1.upload.array('files', 10), chatControllers.upload_media_files);
router.post("/is-first-game", auth_1.authenticateUser, chatControllers.is_first_game);
//==================================== Call Logs ==============================
router.post("/create-call-log", auth_1.authenticateUser, callLogsControllers.createCallLog);
router.get("/get-call-logs", auth_1.authenticateUser, callLogsControllers.getCallLogs);
router.delete("/delete-call-log/:id", auth_1.authenticateUser, callLogsControllers.deleteCallLog);
//==================================== Subscription ==============================
router.get("/get-subscription-plans", auth_1.authenticateUser, subscriptionControllers.getSubscriptionPlans);
router.post("/purchase-subscription", auth_1.authenticateUser, subscriptionControllers.purchaseSubscription);
router.get("/get-user-subscriptions", auth_1.authenticateUser, subscriptionControllers.getUserSubscriptions);
router.get("/get-current-subscription", auth_1.authenticateUser, subscriptionControllers.getCurrentSubscription);
//==================================== Poll ==============================
router.get("/get-random-poll", auth_1.authenticateUser, pollControllers.get_random_poll);
router.post("/submit-poll-answer", auth_1.authenticateUser, pollControllers.submit_poll_answer);
//==================================== Rewards ==============================
router.get("/get-my-rewards", auth_1.authenticateUser, userRewardControllers.get_my_rewards);
//==================================== Report Message ==============================
router.post("/report-message", auth_1.authenticateUser, chatControllers.report_message);

//==================================== Identification face ==============================
router.post("/contact-supports", auth_1.authenticateUser, userControllers.create_contact_support);
router.post("/verify-face", auth_1.authenticateUser, aws_s3_1.uploadToMemory.single('file'), userControllers.face_verification);
router.post("/identity_verification", auth_1.authenticateUser, aws_s3_1.upload.array('files', 10), authControllers.create_verification_documents);
router.get("/get-current-subscription", auth_1.authenticateUser, subscriptionControllers.getCurrentSubscription);



//==================================== Face Recognitions==============================
router.post("/create-collection", userControllers.createCollection);
router.post("/check-user", auth_1.authenticateUser, aws_s3_1.uploadToMemory.single('file'), userControllers.checkUser);




exports.default = router;
