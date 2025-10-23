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
exports.get_user_answers = exports.add_update_user_answer = exports.get_user_report = exports.submit_question_report = exports.is_correct_answer = exports.discover_question_overview = exports.getDiscoverQuestionByDiscover = void 0;
const joi_1 = __importDefault(require("joi"));
const typeorm_1 = require("typeorm");
const UserReport_1 = require("../../entities/UserReport");
const DiscoverQuestion_1 = require("../../entities/DiscoverQuestion");
const responseHandler_1 = require("../../utils/responseHandler");
const User_1 = require("../../entities/User");
const UserAnswer_1 = require("../../entities/UserAnswer");
const getDiscoverQuestionByDiscover = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const get_question_schema = joi_1.default.object({
            discover_name: joi_1.default.string().required()
        });
        const { error, value } = get_question_schema.validate(req.query);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { discover_name } = value;
        console.log(discover_name, "discover name ");
        const discoverRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const question = yield discoverRepo.find({ where: { discover_name } });
        if (!question) {
            return (0, responseHandler_1.handleError)(res, 404, "Discover question not found");
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Discover question fetched successfully", question);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getDiscoverQuestionByDiscover = getDiscoverQuestionByDiscover;
const discover_question_overview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const discoverRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const result = yield discoverRepo
            .createQueryBuilder("discover_question")
            .select("discover_question.discover_name", "discover_name")
            .addSelect("discover_question.discover_description", "discover_description")
            .addSelect("COUNT(*)", "question_count")
            .groupBy("discover_question.discover_name")
            .addGroupBy("discover_question.discover_description") // 👈 Required
            .getRawMany();
        if (!result || result.length === 0) {
            return (0, responseHandler_1.handleError)(res, 404, "No discover questions found");
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Discover questions fetched successfully", result);
    }
    catch (error) {
        console.log(error, "error");
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.discover_question_overview = discover_question_overview;
const is_correct_answer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const is_correct_answer_schema = joi_1.default.object({
            question_id: joi_1.default.number().required(),
            answer: joi_1.default.string().required(),
        });
        const { error, value } = is_correct_answer_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { question_id, answer } = value;
        const discoverRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const question_data = yield discoverRepo.findOne({ where: { question_id: question_id } });
        if (!question_data) {
            return (0, responseHandler_1.handleError)(res, 404, "Question Not Found");
        }
        let is_correct = false;
        // if (question_data.correct_answer == answer) {
        //     is_correct = true
        // }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Answer Data ", is_correct);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.is_correct_answer = is_correct_answer;
const submit_question_report = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user = req.user;
        if (!user)
            return (0, responseHandler_1.handleError)(res, 404, "User Not Found");
        const submit_report_schema = joi_1.default.object({
            discover_name: joi_1.default.string().required(),
            total_score: joi_1.default.number().required(),
            total_achieved_score: joi_1.default.number().required(),
            test_stage: joi_1.default.number().optional().allow("", null),
        });
        const { error, value } = submit_report_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { discover_name, total_score, total_achieved_score, test_stage } = value;
        const percentage = total_score === 0
            ? 0
            : parseFloat(((total_achieved_score / total_score) * 100).toFixed(2));
        const userReportRepo = (0, typeorm_1.getRepository)(UserReport_1.UserReport);
        const userRepo = (0, typeorm_1.getRepository)(User_1.User);
        const existing_report = yield userReportRepo.findOne({ where: { discover_name, user: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id } } });
        if (existing_report) {
            if (total_achieved_score)
                existing_report.total_achieved_score = total_achieved_score;
            if (total_score)
                existing_report.total_score = total_score;
            existing_report.percentage = percentage;
            yield userReportRepo.save(existing_report);
        }
        else {
            const newReport = userReportRepo.create({
                discover_name, total_score, total_achieved_score, percentage, user: req.user
            });
            const saved_report = yield userReportRepo.save(newReport);
        }
        if (test_stage) {
            user.test_stage = test_stage;
            yield userRepo.save(user);
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "User Report Submitted Successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.submit_question_report = submit_question_report;
const get_user_report = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        const userReportRepo = (0, typeorm_1.getRepository)(UserReport_1.UserReport);
        const UserAnswerReportRepo = (0, typeorm_1.getRepository)(UserAnswer_1.UserAnswer);
        const user_report = yield userReportRepo.find({
            where: { user: { user_id: user_id } },
            relations: ["user"],
        });
        if (!user_report || user_report.length === 0) {
            return (0, responseHandler_1.handleError)(res, 404, "User Report Not Found");
        }
        const user_answers = yield UserAnswerReportRepo.find({
            where: { user: { user_id: user_id } },
            relations: ["question", "user"],
        });
        if (!user_answers || user_answers.length === 0) {
            return (0, responseHandler_1.handleError)(res, 404, "User Answer Not Found");
        }
        const total_score = user_report.reduce((acc, report) => acc + Number(report.percentage), 0);
        const user_report_count = user_report.length;
        const categoryScores = {
            Love: { achieved: 0, total: 0 },
            Adventure: { achieved: 0, total: 0 },
            Emotional: { achieved: 0, total: 0 },
            Trust: { achieved: 0, total: 0 },
            Happiness: { achieved: 0, total: 0 },
        };
        user_answers.forEach((answer) => {
            var _a, _b;
            const category = (_a = answer.question) === null || _a === void 0 ? void 0 : _a.question_category;
            if (category && categoryScores.hasOwnProperty(category)) {
                categoryScores[category].achieved += answer.achieved_score || 0;
                categoryScores[category].total += ((_b = answer.question) === null || _b === void 0 ? void 0 : _b.totol_score) || 0;
            }
        });
        const category_scores_percentage = {};
        Object.entries(categoryScores).forEach(([key, value]) => {
            if (value.total > 0) {
                category_scores_percentage[key] = Number(((value.achieved / value.total) * 100).toFixed(2));
            }
            else {
                category_scores_percentage[key] = 0;
            }
        });
        const data = {
            personality_profile_percentage: (total_score / user_report_count).toFixed(2),
            user_report,
            key_strength: category_scores_percentage,
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "User Report Retrieved Successfully", data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_user_report = get_user_report;
const add_update_user_answer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_answer_schema = joi_1.default.object({
            question_id: joi_1.default.number().required(),
            selected_option: joi_1.default.string().required(),
            achieved_score: joi_1.default.number().required()
        });
        const { error, value } = user_answer_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { question_id, selected_option, achieved_score } = value;
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id;
        if (!user_id)
            return (0, responseHandler_1.handleError)(res, 400, "User ID is missing in request.");
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const questionRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const userAnswerRepo = (0, typeorm_1.getRepository)(UserAnswer_1.UserAnswer);
        const [user, question] = yield Promise.all([
            userRepository.findOne({ where: { user_id } }),
            questionRepo.findOne({ where: { question_id } })
        ]);
        if (!user)
            return (0, responseHandler_1.handleError)(res, 404, "User not found.");
        if (!question)
            return (0, responseHandler_1.handleError)(res, 404, "Question not found.");
        let user_answer = yield userAnswerRepo.findOne({
            where: {
                user: { user_id },
                question: { question_id }
            }
        });
        if (!user_answer) {
            user_answer = userAnswerRepo.create({
                user,
                question,
                selected_option,
                achieved_score
            });
        }
        else {
            user_answer.selected_option = selected_option;
            user_answer.achieved_score = achieved_score;
        }
        yield userAnswerRepo.save(user_answer);
        return (0, responseHandler_1.handleSuccess)(res, 201, "Answer submitted successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message || "Something went wrong.");
    }
});
exports.add_update_user_answer = add_update_user_answer;
const get_user_answers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const user_answer_schema = joi_1.default.object({
            discover_name: joi_1.default.string().required(),
        });
        const { error, value } = user_answer_schema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { discover_name } = value;
        const userRepository = (0, typeorm_1.getRepository)(User_1.User);
        const questionRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const userAnswerRepo = (0, typeorm_1.getRepository)(UserAnswer_1.UserAnswer);
        const user = yield userRepository.findOne({ where: { user_id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.user_id } });
        if (!user)
            return (0, responseHandler_1.handleError)(res, 404, "User not found");
        const questions = yield userAnswerRepo.find({ where: { question: { discover_name: discover_name }, user: { user_id: (_b = req.user) === null || _b === void 0 ? void 0 : _b.user_id } }, relations: ['question'] });
        return (0, responseHandler_1.handleSuccess)(res, 201, "Question Retrived Successfully successfully", questions);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_user_answers = get_user_answers;
