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
exports.sendNotificationUser = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firebase_config_user_json_1 = __importDefault(require("./firebase-config-user.json"));
const amorous_app = firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(firebase_config_user_json_1.default),
}, 'user');
const messaging = amorous_app.messaging();
const sendNotificationUser = (token_1, title_1, body_1, ...args_1) => __awaiter(void 0, [token_1, title_1, body_1, ...args_1], void 0, function* (token, title, body, data = {}) {
    try {
        if (!token || typeof token !== 'string' || token.length < 100) {
            console.error('Invalid FCM token:', token);
            return;
        }
        const message = {
            token,
            notification: { title, body },
            data,
        };
        const response = yield messaging.send(message);
        console.log('Notification sent successfully User:', response);
    }
    catch (error) {
        console.error('Error sending notification:', error);
    }
});
exports.sendNotificationUser = sendNotificationUser;
