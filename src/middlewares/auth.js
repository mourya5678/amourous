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
exports.authenticateAdmin = exports.authenticateUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../entities/User");
const Admin_1 = require("../entities/Admin");
const responseHandler_1 = require("../utils/responseHandler");
const dotenv_1 = __importDefault(require("dotenv"));
const typeorm_1 = require("typeorm");
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const authenticateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorizationHeader = req.headers['authorization'];
        if (!authorizationHeader) {
            return (0, responseHandler_1.handleError)(res, 401, "Unauthorized: No token provided");
        }
        const tokenParts = authorizationHeader.split(' ');
        if (tokenParts[0] !== 'Bearer' || tokenParts[1] === 'null' || !tokenParts[1]) {
            return (0, responseHandler_1.handleError)(res, 401, "Unauthorized: Invalid or missing token");
        }
        const token = tokenParts[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (err) {
            return (0, responseHandler_1.handleError)(res, 401, "Unauthorized: Invalid token");
        }
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        console.log(decodedToken.email, "User Connected");
        const user = yield userRepository.findOneBy({ user_id: decodedToken.userId });
        if (!user) {
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        }
        // if (!user.is_active) {
        //     return handleError(res, 401, "You have been blocked by the admin.");
        // }
        req.user = user;
        next();
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.authenticateUser = authenticateUser;
const authenticateAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authorizationHeader = req.headers['authorization'];
        if (!authorizationHeader) {
            return (0, responseHandler_1.handleError)(res, 401, "Unauthorized: No token provided");
        }
        const tokenParts = authorizationHeader.split(' ');
        if (tokenParts[0] !== 'Bearer' || tokenParts[1] === 'null' || !tokenParts[1]) {
            return (0, responseHandler_1.handleError)(res, 401, "Unauthorized: Invalid or missing token");
        }
        const token = tokenParts[1];
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (err) {
            return (0, responseHandler_1.handleError)(res, 401, "Unauthorized: Invalid token");
        }
        const adminRepository = (0, typeorm_1.getRepository)(Admin_1.Admin);
        console.log(decodedToken.email, "Admin Connected");
        const admin = yield adminRepository.findOne({ where: { admin_id: decodedToken.adminId } });
        if (!admin) {
            return (0, responseHandler_1.handleError)(res, 404, "Admin Not Found");
        }
        req.admin = admin;
        next();
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.authenticateAdmin = authenticateAdmin;
