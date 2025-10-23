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
exports.submit_poll_answer = exports.get_random_poll = void 0;
const joi_1 = __importDefault(require("joi"));
const typeorm_1 = require("typeorm");
const Poll_1 = require("../../entities/Poll");
const PollResponse_1 = require("../../entities/PollResponse");
const PollOption_1 = require("../../entities/PollOption");
const Message_1 = require("../../entities/Message");
const responseHandler_1 = require("../../utils/responseHandler");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const get_random_poll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pollRepo = (0, typeorm_1.getRepository)(Poll_1.Poll);
        const pollOptionRepo = (0, typeorm_1.getRepository)(PollOption_1.PollOption);
        const pollResponseRepo = (0, typeorm_1.getRepository)(PollResponse_1.PollResponse);
        const randomPoll = yield pollRepo
            .createQueryBuilder("poll")
            .orderBy("RAND()")
            .limit(1)
            .getOne();
        if (!randomPoll) {
            return (0, responseHandler_1.handleError)(res, 404, "No polls found");
        }
        const get_option = yield pollOptionRepo.find({ where: { poll: { poll_id: randomPoll.poll_id } } });
        let final_data = Object.assign(Object.assign({}, randomPoll), { option: get_option });
        return (0, responseHandler_1.handleSuccess)(res, 200, "Random poll fetched successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_random_poll = get_random_poll;
const submit_poll_answer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            poll_id: joi_1.default.number().required(),
            option_id: joi_1.default.number().required(),
            message_id: joi_1.default.number().optional()
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            (0, responseHandler_1.joiErrorHandle)(res, error);
        const { poll_id, option_id, message_id } = value;
        const pollRepo = (0, typeorm_1.getRepository)(Poll_1.Poll);
        const pollOptionRepo = (0, typeorm_1.getRepository)(PollOption_1.PollOption);
        const pollResponseRepo = (0, typeorm_1.getRepository)(PollResponse_1.PollResponse);
        const messageRepo = (0, typeorm_1.getRepository)(Message_1.Message);
        const user = req.user;
        if (!user)
            return (0, responseHandler_1.handleError)(res, 401, "Unauthorized");
        const check_poll = yield pollRepo.findOne({ where: { poll_id } });
        if (!check_poll)
            return (0, responseHandler_1.handleError)(res, 404, "Poll not found");
        const check_option = yield pollOptionRepo.findOne({ where: { poll_option_id: option_id, poll: { poll_id } } });
        if (!check_option)
            return (0, responseHandler_1.handleError)(res, 404, "Option not found");
        const check_user_answer = yield pollResponseRepo.findOne({ where: { user: { user_id: user.user_id }, poll: { poll_id } } });
        if (check_user_answer) {
            yield pollResponseRepo.update(check_user_answer.poll_response_id, { poll_option: check_option });
        }
        else {
            const create_poll_response = yield pollResponseRepo.create({
                user: user,
                poll: check_poll,
                poll_option: check_option
            });
            const check_message = yield messageRepo.findOne({ where: { message_id } });
            // if (check_message) {
            //     create_poll_response.message = check_message;
            //     await messageRepo.update(message_id, { is_read: true });
            // }
            yield pollResponseRepo.save(create_poll_response);
            return (0, responseHandler_1.handleSuccess)(res, 200, "Poll answer submitted successfully");
        }
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.submit_poll_answer = submit_poll_answer;
