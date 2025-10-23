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
exports.delete_poll = exports.update_poll = exports.get_all_polls = exports.create_poll = void 0;
const joi_1 = __importDefault(require("joi"));
const typeorm_1 = require("typeorm");
const responseHandler_1 = require("../../utils/responseHandler");
const Poll_1 = require("../../entities/Poll");
const PollOption_1 = require("../../entities/PollOption");
const APP_URL = process.env.APP_URL;
const image_logo = process.env.LOGO_URL;
const create_poll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            question: joi_1.default.string().required(),
            winning_score: joi_1.default.number().required(),
            options: joi_1.default.array().items(joi_1.default.object({
                option: joi_1.default.string().required(),
                is_correct: joi_1.default.boolean().required()
            })).required()
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { question, winning_score, options } = value;
        const pollRepo = (0, typeorm_1.getRepository)(Poll_1.Poll);
        const pollOptionRepo = (0, typeorm_1.getRepository)(PollOption_1.PollOption);
        const newPoll = pollRepo.create({
            question: question,
            winning_score: winning_score,
            admin: req.user
        });
        const poll = yield pollRepo.save(newPoll);
        for (const option of options) {
            const newPollOption = pollOptionRepo.create({
                option: option.option,
                poll: poll,
                is_correct: option.is_correct
            });
            yield pollOptionRepo.save(newPollOption);
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Game Created Successfully", poll);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.create_poll = create_poll;
const get_all_polls = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const polls = yield (0, typeorm_1.getRepository)(Poll_1.Poll)
            .createQueryBuilder("poll")
            .leftJoinAndSelect(PollOption_1.PollOption, "option", "option.pollPollId = poll.poll_id")
            .orderBy("poll.created_at", "DESC")
            .getRawMany(); // fetches all fields
        const groupedPollsArray = [];
        const pollMap = {};
        for (const row of polls) {
            const pollId = row.poll_poll_id;
            if (!pollMap[pollId]) {
                const newPoll = {
                    poll_id: pollId,
                    question: row.poll_question,
                    winning_score: row.poll_winning_score,
                    created_at: row.poll_created_at,
                    updated_at: row.poll_updated_at,
                    options: [],
                };
                pollMap[pollId] = newPoll;
                groupedPollsArray.push(newPoll);
            }
            if (row.option_poll_option_id) {
                pollMap[pollId].options.push({
                    poll_option_id: row.option_poll_option_id,
                    option: row.option_option,
                    vote_count: row.option_vote_count,
                    is_correct: row.option_is_correct,
                    created_at: row.option_created_at,
                    updated_at: row.option_updated_at,
                });
            }
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Polls Fetched Successfully", groupedPollsArray);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_all_polls = get_all_polls;
const update_poll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            poll_id: joi_1.default.number().required(),
            question: joi_1.default.string().optional().allow('', null),
            winning_score: joi_1.default.number().optional().allow(null),
            options: joi_1.default.array().items(joi_1.default.object({
                option: joi_1.default.string().optional().allow('', null),
                is_correct: joi_1.default.boolean().optional().allow(null)
            })).optional().allow(null)
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { poll_id, question, winning_score, options } = value;
        const pollRepo = (0, typeorm_1.getRepository)(Poll_1.Poll);
        const pollOptionRepo = (0, typeorm_1.getRepository)(PollOption_1.PollOption);
        const poll = yield pollRepo.findOne({ where: { poll_id: poll_id } });
        if (!poll) {
            return (0, responseHandler_1.handleError)(res, 404, "Poll Not Found");
        }
        if (question)
            poll.question = question;
        if (winning_score)
            poll.winning_score = winning_score;
        yield pollRepo.save(poll);
        if (options) {
            const pollOptions = yield pollOptionRepo.find({ where: { poll: { poll_id: poll_id } } });
            for (const option of pollOptions) {
                yield pollOptionRepo.remove(option);
            }
            for (const option of options) {
                const newPollOption = pollOptionRepo.create({
                    option: option.option,
                    poll: poll,
                    is_correct: option.is_correct
                });
                yield pollOptionRepo.save(newPollOption);
            }
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Game Updated Successfully", poll);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.update_poll = update_poll;
const delete_poll = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = joi_1.default.object({
            poll_id: joi_1.default.number().required()
        });
        const { error, value } = schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { poll_id } = value;
        const pollRepo = (0, typeorm_1.getRepository)(Poll_1.Poll);
        const poll = yield pollRepo.findOne({ where: { poll_id: poll_id } });
        if (!poll) {
            return (0, responseHandler_1.handleError)(res, 404, "Poll Not Found");
        }
        yield pollRepo.remove(poll);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Game Deleted Successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.delete_poll = delete_poll;
