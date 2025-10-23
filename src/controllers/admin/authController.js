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
exports.dashboard_details = exports.changePassword = exports.updateProfile = exports.getProfile = exports.render_success_reset = exports.render_success_register = exports.reset_password = exports.forgot_password = exports.render_forgot_password_page = exports.login_admin = exports.verifyEmail = exports.register_admin = void 0;
const joi_1 = __importDefault(require("joi"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../../entities/User");
const Admin_1 = require("../../entities/Admin");
const typeorm_1 = require("typeorm");
const send_mail_1 = require("../../services/send_mail");
const responseHandler_1 = require("../../utils/responseHandler");
const i18n_1 = require("../../middlewares/i18n");
const Spark_1 = require("../../entities/Spark");
dotenv_1.default.config();
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const generateVerificationLink = (token, baseUrl) => {
    return `${baseUrl}/admin/verify-email?token=${token}`;
};
const generateAccessToken = (payload) => {
    const JWT_SECRET = process.env.JWT_SECRET;
    const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "30d";
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};
const register_admin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const registerSchema = joi_1.default.object({
            name: joi_1.default.string().required(),
            mobile_number: joi_1.default.string().required().allow(""),
            email: joi_1.default.string().required(),
            password: joi_1.default.string().min(8).required(),
        });
        const { error, value } = registerSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { name, password, mobile_number, email } = value;
        const adminRepository = (0, typeorm_1.getRepository)(Admin_1.Admin);
        const existEmail = yield adminRepository.findOne({ where: { email } });
        if (existEmail)
            return (0, responseHandler_1.handleError)(res, 400, (0, i18n_1.getMessage)("en", "EMAIL_ALREADY"));
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        const newAdmin = adminRepository.create({
            name: name,
            mobile_number: mobile_number,
            email: email,
            password: hashedPassword,
            show_password: password,
            is_verified: true
        });
        yield adminRepository.save(newAdmin);
        return (0, responseHandler_1.handleSuccess)(res, 201, (0, i18n_1.getMessage)("en", "ADMIN_CREATED"));
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.register_admin = register_admin;
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tokenSchema = joi_1.default.object({
            token: joi_1.default.string().required()
        });
        const { error, value } = tokenSchema.validate(req.query);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { token } = value;
        console.log(token);
        const adminRepository = (0, typeorm_1.getRepository)(Admin_1.Admin);
        const admin = yield adminRepository.findOne({
            where: {
                verify_token: token,
                verify_token_expiry: (0, typeorm_1.MoreThan)(new Date())
            }
        });
        if (!admin) {
            return res.render("sessionExpire.ejs");
        }
        admin.is_verified = true;
        admin.verify_token = null;
        admin.verify_token_expiry = null;
        yield adminRepository.save(admin);
        return res.render("successRegister.ejs");
    }
    catch (error) {
        console.error('Error in verifyEmail:', error);
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.verifyEmail = verifyEmail;
const login_admin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loginSchema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
            password: joi_1.default.string().min(8).required(),
        });
        const { error, value } = loginSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { email, password } = value;
        const adminRepository = (0, typeorm_1.getRepository)(Admin_1.Admin);
        const admin = yield adminRepository.findOneBy({ email });
        if (!admin)
            return (0, responseHandler_1.handleError)(res, 404, (0, i18n_1.getMessage)("en", "ADMIN_NOT_FOUND"));
        let language = admin.language;
        if (admin.is_verified == false)
            return (0, responseHandler_1.handleError)(res, 400, (0, i18n_1.getMessage)(language, "VERIFY_EMAIL_FIRST"));
        const isMatch = yield bcrypt_1.default.compare(password, admin.password);
        if (!isMatch)
            return (0, responseHandler_1.handleError)(res, 400, (0, i18n_1.getMessage)(language, "INVALID_CREDENTIAL"));
        const payload = { adminId: admin.admin_id, email: admin.email };
        const token = generateAccessToken(payload);
        admin.jwt_token = token;
        let saved_admin = yield adminRepository.save(admin);
        // return handleSuccess(res, 200, "Login Successful", token)
        return (0, responseHandler_1.handleSuccess)(res, 200, "Login Successful", saved_admin);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.login_admin = login_admin;
const render_forgot_password_page = (req, res) => {
    try {
        return res.render("resetPasswordAdmin.ejs");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
};
exports.render_forgot_password_page = render_forgot_password_page;
const forgot_password = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const forgotPasswordSchema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
        });
        const { error, value } = forgotPasswordSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { email } = value;
        const adminRepository = (0, typeorm_1.getRepository)(Admin_1.Admin);
        const admin = yield adminRepository.findOneBy({ email });
        if (!admin) {
            return (0, responseHandler_1.handleError)(res, 404, "Admin Not Found");
        }
        const verifyToken = crypto_1.default.randomBytes(32).toString('hex');
        const verifyTokenExpiry = new Date(Date.now() + 3600000);
        if (admin.is_verified == false) {
            return (0, responseHandler_1.handleError)(res, 400, "Please Verify your email first");
        }
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000);
        admin.reset_password_token = resetToken;
        admin.reset_password_token_expiry = resetTokenExpiry;
        yield adminRepository.save(admin);
        const resetLink = `${req.protocol}://${req.get("host")}/admin/reset-password?token=${resetToken}`;
        const emailTemplatePath = path_1.default.resolve(__dirname, '../../views/forgotPasswordAdmin.ejs');
        const emailHtml = yield ejs_1.default.renderFile(emailTemplatePath, { resetLink, image_logo });
        const emailOptions = {
            to: email,
            subject: "Password Reset Request",
            html: emailHtml,
        };
        yield (0, send_mail_1.sendEmail)(emailOptions);
        return (0, responseHandler_1.handleSuccess)(res, 200, `Password reset link sent to your email (${email}).`);
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
        const adminRepository = (0, typeorm_1.getRepository)(Admin_1.Admin);
        const admin = yield adminRepository.findOne({
            where: {
                reset_password_token: token,
                reset_password_token_expiry: (0, typeorm_1.MoreThan)(new Date()),
            },
        });
        if (!admin) {
            return (0, responseHandler_1.handleError)(res, 400, "Invalid or expired token");
        }
        if (admin.show_password == newPassword) {
            return (0, responseHandler_1.handleError)(res, 400, "Password cannot be the same as the previous password.");
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, salt);
        admin.password = hashedPassword;
        admin.show_password = newPassword;
        admin.reset_password_token = null;
        admin.reset_password_token_expiry = null;
        yield adminRepository.save(admin);
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
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const admin_req = req.admin;
        const adminRepository = (0, typeorm_1.getRepository)(Admin_1.Admin);
        const admin = yield adminRepository.findOneBy({ admin_id: admin_req.admin_id });
        if (!admin) {
            return (0, responseHandler_1.handleError)(res, 404, "Admin Not Found");
        }
        if (admin.profile_image && !admin.profile_image.startsWith("http")) {
            admin.profile_image = `${APP_URL}${admin.profile_image}`;
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Admin profile fetched successfully", admin);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getProfile = getProfile;
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updateProfileSchema = joi_1.default.object({
            name: joi_1.default.string().required(),
            mobile_number: joi_1.default.string().required(),
        });
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { name, mobile_number } = value;
        const admin_req = req.admin;
        const adminRepository = (0, typeorm_1.getRepository)(Admin_1.Admin);
        const admin = yield adminRepository.findOne({ where: { admin_id: admin_req.admin_id } });
        if (!admin) {
            return (0, responseHandler_1.handleError)(res, 404, "Admin Not Found");
        }
        if (name)
            admin.name = name;
        if (mobile_number)
            admin.mobile_number = mobile_number;
        if (req.file) {
            const profile_image = req.file.location;
            admin.profile_image = profile_image;
        }
        yield adminRepository.save(admin);
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
        const admin_req = req.admin;
        const { currentPassword, newPassword } = req.body;
        const adminRepository = (0, typeorm_1.getRepository)(Admin_1.Admin);
        const admin = yield adminRepository.findOneBy({ admin_id: admin_req.admin_id });
        if (!admin) {
            return (0, responseHandler_1.handleError)(res, 404, "Admin Not Found");
        }
        const isMatch = yield bcrypt_1.default.compare(currentPassword, admin.password);
        if (!isMatch) {
            return (0, responseHandler_1.handleError)(res, 400, "Current password is incorrect");
        }
        if (admin.show_password == newPassword) {
            return (0, responseHandler_1.handleError)(res, 400, "Password cannot be the same as the previous password.");
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        admin.password = hashedPassword;
        admin.show_password = newPassword;
        yield adminRepository.save(admin);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Password changed successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.changePassword = changePassword;
const dashboard_details = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const sparkRepository = (0, typeorm_1.getRepository)(Spark_1.Spark);
        const total_users = yield userRepository.count({ where: { is_test_completed: true } });
        const sparks = yield sparkRepository.find({
            relations: ["send_by", "send_to"],
        });
        const matchSet = new Set();
        for (const spark of sparks) {
            const sender = (_a = spark.send_by) === null || _a === void 0 ? void 0 : _a.user_id;
            const receiver = (_b = spark.send_to) === null || _b === void 0 ? void 0 : _b.user_id;
            if (!sender || !receiver)
                continue;
            const matchKey1 = `${sender}-${receiver}`;
            const matchKey2 = `${receiver}-${sender}`;
            if (matchSet.has(matchKey2)) {
                continue;
            }
            const hasReverse = sparks.find((s) => { var _a, _b; return ((_a = s.send_by) === null || _a === void 0 ? void 0 : _a.user_id) === receiver && ((_b = s.send_to) === null || _b === void 0 ? void 0 : _b.user_id) === sender; });
            if (hasReverse) {
                matchSet.add(matchKey1);
            }
        }
        const data = {
            total_users: total_users || 0,
            active_subscriptions: 0,
            matches_made: matchSet.size,
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "Dashboard Data Retrieved Successfully", data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.dashboard_details = dashboard_details;
