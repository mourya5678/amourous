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
exports.deleteDiscoverQuestion = exports.updateDiscoverQuestion = exports.getDiscoverQuestionById = exports.getAllDiscoverQuestions = exports.createDiscoverQuestion = void 0;
const joi_1 = __importDefault(require("joi"));
const typeorm_1 = require("typeorm");
const i18n_1 = require("../../middlewares/i18n");
const DiscoverQuestion_1 = require("../../entities/DiscoverQuestion");
const responseHandler_1 = require("../../utils/responseHandler");
const createDiscoverQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const discoverQuestionSchema = joi_1.default.object({
            discover_name: joi_1.default.string().optional(),
            question: joi_1.default.string().required(),
            options: joi_1.default.array().items(joi_1.default.any()).required(),
            totol_score: joi_1.default.number().required()
        });
        const { error, value } = discoverQuestionSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { discover_name, question, options, totol_score } = value;
        const discoverRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const existingQuestion = yield discoverRepo.findOneBy({ question });
        if (existingQuestion) {
            return (0, responseHandler_1.handleError)(res, 400, (0, i18n_1.getMessage)("en", "DISCOVER_QUESTION_EXISTS"));
        }
        const newQuestion = discoverRepo.create({
            discover_name,
            question,
            options,
            totol_score
        });
        yield discoverRepo.save(newQuestion);
        return (0, responseHandler_1.handleSuccess)(res, 201, (0, i18n_1.getMessage)("en", "DISCOVER_QUESTION_CREATED"), newQuestion);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.createDiscoverQuestion = createDiscoverQuestion;
const getAllDiscoverQuestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const discoverRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const questions = yield discoverRepo.find();
        const result = yield discoverRepo
            .createQueryBuilder("discover_question")
            .select("discover_question.discover_name", "discover_name")
            .addSelect("COUNT(*)", "question_count")
            .groupBy("discover_question.discover_name")
            .getRawMany();
        const final_data = {
            questions,
            summary: result
        };
        return (0, responseHandler_1.handleSuccess)(res, 200, "Discover questions fetched successfully", final_data);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getAllDiscoverQuestions = getAllDiscoverQuestions;
const getDiscoverQuestionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const discoverRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const question = yield discoverRepo.findOneBy({ question_id: Number(id) });
        if (!question) {
            return (0, responseHandler_1.handleError)(res, 404, "Discover question not found");
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Discover question fetched successfully", question);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.getDiscoverQuestionById = getDiscoverQuestionById;
const updateDiscoverQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const discoverQuestionSchema = joi_1.default.object({
            question_id: joi_1.default.number().required(),
            discover_name: joi_1.default.string().optional(),
            question: joi_1.default.string().optional(),
            options: joi_1.default.array().items(joi_1.default.any()).optional(),
            totol_score: joi_1.default.number().optional()
        });
        const { error, value } = discoverQuestionSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { discover_name, question, options, totol_score, question_id } = value;
        const discoverRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const existingQuestion = yield discoverRepo.findOneBy({ question_id: Number(question_id) });
        if (!existingQuestion) {
            return (0, responseHandler_1.handleError)(res, 404, "Discover question not found");
        }
        if (discover_name)
            existingQuestion.discover_name = discover_name;
        if (question)
            existingQuestion.question = question;
        if (options)
            existingQuestion.options = options;
        // if (totol_score) existingQuestion.totol_score = totol_score;
        yield discoverRepo.save(existingQuestion);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Discover question updated successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.updateDiscoverQuestion = updateDiscoverQuestion;
const deleteDiscoverQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const discoverRepo = (0, typeorm_1.getRepository)(DiscoverQuestion_1.DiscoverQuestion);
        const existingQuestion = yield discoverRepo.findOneBy({ question_id: Number(id) });
        if (!existingQuestion) {
            return (0, responseHandler_1.handleError)(res, 404, "Discover question not found");
        }
        yield discoverRepo.delete(id);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Discover question deleted successfully");
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.deleteDiscoverQuestion = deleteDiscoverQuestion;
