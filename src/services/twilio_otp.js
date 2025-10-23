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
exports.sendOTP = void 0;
const axios_1 = __importDefault(require("axios"));
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const sendOTP = (to, body) => __awaiter(void 0, void 0, void 0, function* () {
    const messageSendUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    try {
        const data_for_post = {
            To: `${to}`,
            From: fromNumber,
            Body: body,
        };
        const response = yield axios_1.default.post(messageSendUrl, data_for_post, {
            auth: {
                username: accountSid,
                password: authToken,
            },
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });
        console.log("otp send successfully on this number", to);
        return response.data;
    }
    catch (error) {
        console.error("Error sending the OTP:", error.response ? error.response.data : error.message);
    }
});
exports.sendOTP = sendOTP;
