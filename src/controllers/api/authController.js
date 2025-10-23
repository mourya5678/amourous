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
exports.online_offline_user = exports.deleteAccount = exports.delete_profile_photos = exports.update_photos = exports.update_preferences = exports.changePassword = exports.updateProfile = exports.render_success_reset = exports.render_success_register = exports.reset_password = exports.forgot_password = exports.render_privacy_policy = exports.render_terms_and_condition = exports.render_forgot_password_page = exports.social_login = exports.login_with_otp = exports.login_with_email = exports.verifyEmail = exports.login_with_mobile = exports.register_with_email = exports.generateAccessTokenForMobileLogin = exports.generateVerificationLink = void 0;
const joi_1 = __importDefault(require("joi"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ejs_1 = __importDefault(require("ejs"));
const User_1 = require("../../entities/User");
const typeorm_1 = require("typeorm");
const send_mail_1 = require("../../services/send_mail");
const function_1 = require("../../utils/function");
// import { upload_file_with_s3 } from "../../utils/aws.s3";
const ProfileImage_1 = require("../../entities/ProfileImage");
const responseHandler_1 = require("../../utils/responseHandler");
const app_1 = require("../../../app");
const UserSubcription_1 = require("../../entities/UserSubcription");
const uuid_1 = require("../../utils/uuid");
const sharp_1 = __importDefault(require("sharp"));
const aws_s3_1 = require("../../utils/aws.s3");
const UsersVerificationDocuments_1 = require("../../entities/UsersVerificationDocuments");
const { v4: uuidv4 } = require("uuid");
dotenv_1.default.config();
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const generateVerificationLink = (token, baseUrl) => {
    return `${baseUrl}/api/verify-email?token=${token}`;
};
exports.generateVerificationLink = generateVerificationLink;
const generateAccessToken = (payload) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};
const generateAccessTokenForMobileLogin = (payload) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRATION = process.env.JWT_EXPIRATION;
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};
exports.generateAccessTokenForMobileLogin = generateAccessTokenForMobileLogin;
const register_with_email = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const registerSchema = joi_1.default.object({
            full_name: joi_1.default.string().optional().allow("", null),
            email: joi_1.default.string().required(),
            mobile_number: joi_1.default.string().required(),
            password: joi_1.default.string().min(8).required(),
            is_push_notification_on: joi_1.default.boolean().required(),
        });
        const { error, value } = registerSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { full_name, password, email, is_push_notification_on, mobile_number } = value;
        let lower_email = email.toLowerCase();
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const existEmail = yield userRepository.findOne({ where: { email: lower_email } });
        if (existEmail) {
            return (0, responseHandler_1.handleError)(res, 400, "Email already exists.");
        }
        const existMobile = yield userRepository.findOne({ where: { mobile_number: mobile_number } });
        if (existMobile) {
            return (0, responseHandler_1.handleError)(res, 400, "Mobile Number Already Exists.");
        }
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const verifyToken = crypto_1.default.randomBytes(32).toString('hex');
        const verifyTokenExpiry = new Date(Date.now() + 3600000);
        const newUser = userRepository.create({
            full_name: full_name,
            mobile_number: mobile_number,
            email: lower_email,
            password: hashedPassword,
            show_password: password,
            verify_token: verifyToken,
            verify_token_expiry: verifyTokenExpiry,
            is_push_notification_on: is_push_notification_on,
        });
        const baseUrl = req.protocol + '://' + req.get('host');
        const verificationLink = (0, exports.generateVerificationLink)(verifyToken, baseUrl);
        const emailTemplatePath = path_1.default.resolve(__dirname, '../../views/verifyAccount.ejs');
        const emailHtml = yield ejs_1.default.renderFile(emailTemplatePath, { verificationLink, image_logo });
        const emailOptions = {
            to: lower_email,
            subject: "Verify Your Email Address",
            html: emailHtml,
        };
        yield (0, send_mail_1.sendEmail)(emailOptions);
        yield userRepository.save(newUser);
        const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        const userSubscription = userSubscriptionRepo.create({
            user: newUser,
            plan: { subscription_plan_id: 1 },
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        yield userSubscriptionRepo.save(userSubscription);
        return (0, responseHandler_1.handleSuccess)(res, 201, `Verification link sent successfully to your email (${lower_email}). Please verify your account.`);
    }
    catch (error) {
        console.error('Error in register:', error);
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.register_with_email = register_with_email;
const login_with_mobile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sendOtpSchema = joi_1.default.object({
            mobile_number: joi_1.default.string().required(),
        });
        const { error, value } = sendOtpSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { mobile_number } = value;
        console.log(mobile_number, "mobile_number");
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        let user = yield userRepository.findOne({ where: { mobile_number } });
        if (!user) {
            const newUser = userRepository.create({
                mobile_number,
                otp: "",
                is_verified: false,
            });
            yield userRepository.save(newUser);
            user = newUser;
        }
        if (!user.is_active) {
            return (0, responseHandler_1.handleError)(res, 400, "Your account has been deactivated by the admin.");
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.otp = otp;
        yield userRepository.save(user);
        return (0, responseHandler_1.handleSuccess)(res, 200, "OTP sent successfully to your mobile number.", otp);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.login_with_mobile = login_with_mobile;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.query;
        console.log(token);
        if (typeof token !== 'string') {
            return (0, responseHandler_1.handleError)(res, 400, "Invalid token.");
        }
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOne({
            where: {
                verify_token: token,
                verify_token_expiry: (0, typeorm_1.MoreThan)(new Date())
            }
        });
        if (!user) {
            return res.render("sessionExpire.ejs");
        }
        user.is_verified = true;
        user.verify_token = null;
        user.verify_token_expiry = null;
        yield userRepository.save(user);
        return res.render("successRegister.ejs");
    }
    catch (error) {
        console.error('Error in verifyEmail:', error);
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.verifyEmail = verifyEmail;
const login_with_email = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loginSchema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
            password: joi_1.default.string().min(8).required(),
            fcmToken: joi_1.default.string().required(),
        });
        const { error, value } = loginSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { email, password, fcmToken } = value;
        let lower_email = email.toLowerCase();
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOneBy({ email: lower_email });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found.");
        }
        if (user.is_verified === false) {
            return (0, responseHandler_1.handleError)(res, 400, "Please Verify your email first");
        }
        if (!user.password) {
            return (0, responseHandler_1.handleError)(res, 400, "Invalid Credential");
        }
        if (!user.is_active) {
            return (0, responseHandler_1.handleError)(res, 400, "Your account has been deactivated by the admin.");
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return (0, responseHandler_1.handleError)(res, 400, "Invalid credentials");
        }
        const payload = { userId: user.user_id, email: user.email };
        const token = generateAccessToken(payload);
        user.jwt_token = token;
        user.fcm_token = fcmToken;
        yield userRepository.save(user);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Login Successful.", token);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.login_with_email = login_with_email;
const login_with_otp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loginOtpSchema = joi_1.default.object({
            mobile_number: joi_1.default.string().required(),
            otp: joi_1.default.string().length(4).required(),
        });
        const { error, value } = loginOtpSchema.validate(req.body);
        if (error) {
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        }
        const { mobile_number, otp } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOne({ where: { mobile_number } });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found.");
        }
        if (!user.is_active) {
            return (0, responseHandler_1.handleError)(res, 400, "Your account has been deactivated by the admin.");
        }
        if (user.otp !== otp) {
            return (0, responseHandler_1.handleError)(res, 400, "Invalid OTP.");
        }
        const payload = { userId: user.user_id, mobile_number: user.mobile_number };
        const token = (0, exports.generateAccessTokenForMobileLogin)(payload);
        user.jwt_token = token;
        user.otp = "";
        user.is_verified = true;
        yield userRepository.save(user);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Login Successful.", token);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.login_with_otp = login_with_otp;
const social_login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const googleSchema = joi_1.default.object({
            full_name: joi_1.default.string().required(),
            fcmToken: joi_1.default.string().required(),
            email: joi_1.default.string().email().required(),
            profile_image: joi_1.default.string().uri().required(),
            signup_method: joi_1.default.string().valid("google", "facebook").required()
        });
        const { error, value } = googleSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { full_name, email, profile_image, signup_method, fcmToken } = value;
        let lower_email = email.toLowerCase();
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        let user = yield userRepository.findOneBy({ email: lower_email });
        if (!user) {
            const newUser = userRepository.create({
                full_name: full_name,
                email: lower_email,
                profile_image: profile_image,
                is_verified: true,
                signup_method: signup_method,
                fcm_token: fcmToken
            });
            user = yield userRepository.save(newUser);
            const payload = { userId: user.user_id, email: user.email };
            const token = generateAccessToken(payload);
            user.jwt_token = token;
            user.fcm_token = fcmToken;
            yield userRepository.save(user);
            const userSubscriptionRepo = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
            const userSubscription = userSubscriptionRepo.create({
                user: user,
                plan: { subscription_plan_id: 1 },
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            yield userSubscriptionRepo.save(userSubscription);
            return (0, responseHandler_1.handleSuccess)(res, 201, `Successfully signed up..`, token);
        }
        else {
            const payload = { userId: user.user_id, email: user.email };
            const token = generateAccessToken(payload);
            user.jwt_token = token;
            user.fcm_token = fcmToken;
            yield userRepository.save(user);
            return (0, responseHandler_1.handleSuccess)(res, 200, `Login Successful.`, token);
        }
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.social_login = social_login;
const render_forgot_password_page = (req, res) => {
    try {
        return res.render("resetPassword.ejs");
    }
    catch (error) {
        console.error("Error rendering forgot password page:", error);
        return (0, responseHandler_1.handleError)(res, 500, "An error occurred while rendering the page");
    }
};
exports.render_forgot_password_page = render_forgot_password_page;
const render_terms_and_condition = (req, res) => {
    try {
        return res.render("terms_and_condition.ejs");
    }
    catch (error) {
        console.error("Error rendering forgot password page:", error);
        return (0, responseHandler_1.handleError)(res, 500, "An error occurred while rendering the page");
    }
};
exports.render_terms_and_condition = render_terms_and_condition;
const render_privacy_policy = (req, res) => {
    try {
        return res.render("privacy_policy.ejs");
    }
    catch (error) {
        console.error("Error rendering forgot password page:", error);
        return (0, responseHandler_1.handleError)(res, 500, "An error occurred while rendering the page");
    }
};
exports.render_privacy_policy = render_privacy_policy;
const forgot_password = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const forgotPasswordSchema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
        });
        const { error } = forgotPasswordSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase();
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOneBy({ email: normalizedEmail });
        if (!user)
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        if (!user.is_verified) {
            return (0, responseHandler_1.handleError)(res, 400, "Please verify your email first.");
        }
        user.reset_password_token = crypto_1.default.randomBytes(32).toString("hex");
        user.reset_password_token_expiry = new Date(Date.now() + 3600000);
        user.otp = Math.floor(1000 + Math.random() * 9000).toString();
        yield userRepository.save(user);
        const resetLink = `${req.protocol}://${req.get("host")}/api/reset-password?token=${user.reset_password_token}`;
        const emailTemplatePath = path_1.default.resolve(__dirname, "../../views/forgotPassword.ejs");
        const emailHtml = yield ejs_1.default.renderFile(emailTemplatePath, { resetLink, image_logo, otp: user.otp });
        yield (0, send_mail_1.sendEmail)({
            to: normalizedEmail,
            subject: "Password Reset Request",
            html: emailHtml,
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, `Password reset link sent to your email (${normalizedEmail}).`);
    }
    catch (error) {
        console.error("Error in forgot password controller:", error);
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.forgot_password = forgot_password;
const reset_password = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resetPasswordSchema = joi_1.default.object({
            token: joi_1.default.string().required(),
            newPassword: joi_1.default.string().min(8).required().messages({
                "string.min": "Password must be at least 8 characters long",
                "any.required": "New password is required",
            }),
        });
        const { error, value } = resetPasswordSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { token, newPassword } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOne({
            where: {
                reset_password_token: token,
                reset_password_token_expiry: (0, typeorm_1.MoreThan)(new Date()),
            },
        });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 400, "Invalid or expired token");
        }
        if (user.show_password == newPassword) {
            return (0, responseHandler_1.handleError)(res, 400, "Password cannot be the same as the previous password.");
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, salt);
        user.password = hashedPassword;
        user.show_password = newPassword;
        user.reset_password_token = null;
        user.reset_password_token_expiry = null;
        yield userRepository.save(user);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Password reset successfully.");
    }
    catch (error) {
        console.error("Error in reset password controller:", error);
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.reset_password = reset_password;
const render_success_register = (req, res) => {
    return res.render("successRegister.ejs");
};
exports.render_success_register = render_success_register;
const render_success_reset = (req, res) => {
    return res.render("successReset.ejs");
};
exports.render_success_reset = render_success_reset;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updateProfileSchema = joi_1.default.object({
            full_name: joi_1.default.string().optional().allow("", null),
            gender: joi_1.default.string().valid("Male", "Female", "Other").optional().allow("", null),
            address: joi_1.default.string().optional().allow("", null),
            dob: joi_1.default.string().optional().allow("", null),
            interests: joi_1.default.string().optional().allow("", null),
            looking_for: joi_1.default.string().optional().allow("", null),
            looking_for_vibe: joi_1.default.string().optional().allow("", null),
            bio: joi_1.default.string().optional().allow("", null),
            brigh_by: joi_1.default.string().optional().allow("", null),
            mobile_number: joi_1.default.string().optional().allow("", null),
            latitude: joi_1.default.number().optional().allow("", null),
            longitude: joi_1.default.number().optional().allow("", null),
            is_push_notification_on: joi_1.default.boolean().optional().allow("", null),
            is_profile_private: joi_1.default.boolean().optional().allow("", null),
            is_live_location_on: joi_1.default.boolean().optional().allow("", null),
            i_am: joi_1.default.string().optional().allow("", null),
            is_complete_profile: joi_1.default.boolean().optional().allow("", null),
            is_test_completed: joi_1.default.boolean().optional().allow("", null),
            test_stage: joi_1.default.number().optional().allow("", null),
        });
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { full_name, gender, dob, interests, looking_for, bio, brigh_by, latitude, longitude, is_push_notification_on, is_live_location_on, i_am, looking_for_vibe, is_complete_profile, is_test_completed, mobile_number, test_stage, is_profile_private } = value;
        const user_req = req.user;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const userSubscriptionRepository = (0, typeorm_1.getRepository)(UserSubcription_1.UserSubscription);
        let address = req.body.address;
        if (latitude && longitude) {
            if (address) {
                address = address;
            }
            else {
                address = yield (0, function_1.getAddressFromCoordinates)(latitude, longitude);
            }
        }
        const user = yield userRepository.findOne({ where: { user_id: user_req.user_id } });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        }
        if (full_name)
            user.full_name = full_name;
        if (gender)
            user.gender = gender;
        if (address)
            user.address = address;
        if (test_stage)
            user.test_stage = test_stage;
        if (dob) {
            user.dob = dob;
            let age = (0, function_1.calculate_age)(dob);
            user.age = age;
        }
        if (i_am)
            user.i_am = i_am;
        if (mobile_number)
            user.mobile_number = mobile_number;
        if (is_test_completed)
            user.is_test_completed = is_test_completed;
        if (looking_for_vibe)
            user.looking_for_vibe = looking_for_vibe;
        if (interests)
            user.interests = interests;
        if (looking_for)
            user.looking_for = looking_for;
        if (bio)
            user.bio = bio;
        if (brigh_by)
            user.brigh_by = brigh_by;
        if (latitude)
            user.latitude = latitude;
        if (longitude)
            user.longitude = longitude;
        user.is_push_notification_on = is_push_notification_on;
        user.is_live_location_on = is_live_location_on;
        user.is_profile_private = is_profile_private;
        if (is_complete_profile)
            user.is_complete_profile = is_complete_profile;
        const userSubscription = yield userSubscriptionRepository.findOne({ where: { user: { user_id: user.user_id }, isActive: true }, relations: ["plan"] });
        if (!userSubscription)
            return (0, responseHandler_1.handleError)(res, 400, "User subscription not found");
        if (req.file) {
            if (userSubscription.plan.subscription_plan_id == 1) {
                const fileName = `profile/${(0, uuid_1.uuidv4)()}.jpg`;
                const uploadResult = yield aws_s3_1.s3
                    .upload({
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: fileName,
                        Body: req.file.buffer,
                        ContentType: req.file.mimetype,
                        ACL: 'public-read',
                        CacheControl: 'public, max-age=31536000',
                    })
                    .promise();
                user.profile_image = uploadResult.Location;
            }
            else {
                const buffer = yield (0, sharp_1.default)(req.file.buffer)
                    .blur(20)
                    .jpeg()
                    .toBuffer();
                const fileName = `processed/blurred-${(0, uuid_1.uuidv4)()}.jpg`;
                const uploadResult = yield aws_s3_1.s3
                    .upload({
                        Bucket: process.env.S3_BUCKET_NAME,
                        Key: fileName,
                        Body: buffer,
                        ContentType: 'image/jpeg',
                        ACL: 'public-read',
                        CacheControl: 'public, max-age=31536000',
                    })
                    .promise();
                user.profile_image = uploadResult.Location;
            }
        }
        // if(req.file && 'location' in req.file){
        //     user.profile_image = (req.file as Express.MulterS3.File).location;
        // }
        yield userRepository.save(user);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Profile updated successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.updateProfile = updateProfile;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const changePasswordSchema = joi_1.default.object({
            currentPassword: joi_1.default.string().required(),
            newPassword: joi_1.default.string().min(8).required(),
        });
        const { error } = changePasswordSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const user_req = req.user;
        const { currentPassword, newPassword } = req.body;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOneBy({ user_id: user_req.user_id });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 400, "User Not Found");
        }
        const isMatch = yield bcrypt_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return (0, responseHandler_1.handleError)(res, 400, "Current password is incorrect");
        }
        if (user.show_password == newPassword) {
            return (0, responseHandler_1.handleError)(res, 400, "Password cannot be the same as the previous password.");
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        user.show_password = newPassword;
        yield userRepository.save(user);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Password changed successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.changePassword = changePassword;
const update_preferences = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updateProfileSchema = joi_1.default.object({
            looking_for: joi_1.default.string().valid("Male", "Female", "Other", "All").optional().allow("", null),
            age_range: joi_1.default.string().optional().allow("", null),
            km_range: joi_1.default.string().optional().allow("", null),
        });
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { km_range, looking_for, age_range } = value;
        const user_req = req.user;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOne({ where: { user_id: user_req.user_id } });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        }
        if (km_range)
            user.looking_for_km_range = km_range;
        if (looking_for)
            user.looking_for = looking_for;
        if (age_range)
            user.looking_for_age_range = age_range;
        yield userRepository.save(user);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Preferences updated successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.update_preferences = update_preferences;
const update_photos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user_req = req.user;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const ProfileImageRepository = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        if (Array.isArray(req.files) && req.files.length > 0) {
            const newPhotos = yield Promise.all(req.files.map((file) => {
                return ProfileImageRepository.create({
                    user: user_req,
                    image: file.location
                });
            }));
            yield ProfileImageRepository.save(newPhotos);
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Profile Photos updated successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.update_photos = update_photos;
const delete_profile_photos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const delete_profile_images_schema = joi_1.default.object({
            profile_image_ids: joi_1.default.array().required(),
        });
        const { error, value } = delete_profile_images_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { profile_image_ids } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const ProfileImageRepository = (0, typeorm_1.getRepository)(ProfileImage_1.ProfileImage);
        if (Array.isArray(profile_image_ids) && profile_image_ids.length > 0) {
            profile_image_ids.map((profile_image_id) => __awaiter(void 0, void 0, void 0, function* () {
                return (yield ProfileImageRepository.delete({
                    profile_image_id: profile_image_id
                }));
            }));
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Profile Photos Deleted successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.delete_profile_photos = delete_profile_photos;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id) {
            return (0, responseHandler_1.handleError)(res, 400, "User ID is required.");
        }
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOne({ where: { user_id } });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Account not found.");
        }
        yield userRepository.delete(user_id);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Account deleted successfully.");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.deleteAccount = deleteAccount;
const online_offline_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            is_online: joi_1.default.boolean().required()
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { is_online } = value;
        const user_req = req.user;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = yield userRepository.findOne({ where: { user_id: user_req.user_id } });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        }
        user.is_online = is_online;
        let response_message = is_online ? 'Online' : 'Offline';
        yield userRepository.save(user);
        app_1.io.emit('user_status_change', {
            user_id: user.user_id,
            full_name: user.full_name,
            profile_image: user.profile_image,
            is_online: is_online
        });
        return (0, responseHandler_1.handleSuccess)(res, 200, `User ${response_message} successfully`);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.online_offline_user = online_offline_user;

const create_verification_documents = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const files = req.files;

        if (!files || files.length === 0) {
            return (0, responseHandler_1.handleError)(res, 400, "No documents uploaded.");
        }

        const VerificationRepo = (0, typeorm_1.getRepository)(UsersVerificationDocuments_1.UsersVerificationDocuments);
        const uploadPromises = files.map(async file => {
            let docs = aws_s3_1.getPublicUrl(file.key)
            return VerificationRepo.create({
                user_id: user_id,
                goverment_docs: docs
            });
        });

        const entries = await Promise.all(uploadPromises);
        await VerificationRepo.save(entries);

        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const user = await userRepository.findOne({ where: { user_id: user_id } });
        user.is_documents_verified = 0;
        await userRepository.save(user);

        return (0, responseHandler_1.handleSuccess)(res, 200, "Documents uploaded successfully.");
    } catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
};

exports.create_verification_documents = create_verification_documents;

