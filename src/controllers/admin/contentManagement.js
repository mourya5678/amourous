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
exports.updateContent = exports.get_contents = exports.createContent = void 0;
const joi_1 = __importDefault(require("joi"));
const typeorm_1 = require("typeorm");
const ContentManagement_1 = require("../../entities/ContentManagement");
const responseHandler_1 = require("../../utils/responseHandler");
const createContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contentSchema = joi_1.default.object({
            content_type: joi_1.default.string().optional(),
            content: joi_1.default.string().optional()
        });
        const { error, value } = contentSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const contentRepo = (0, typeorm_1.getRepository)(ContentManagement_1.ContentManagement);
        const newContent = contentRepo.create(value);
        yield contentRepo.save(newContent);
        return (0, responseHandler_1.handleSuccess)(res, 201, "Content created successfully", newContent);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.createContent = createContent;
const get_contents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contentSchema = joi_1.default.object({
            content_type: joi_1.default.string().optional(),
        });
        const { error, value } = contentSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { content_type } = value;
        const contentRepo = (0, typeorm_1.getRepository)(ContentManagement_1.ContentManagement);
        const content = yield contentRepo.findOne({ where: { content_type } });
        if (!content) {
            return (0, responseHandler_1.handleError)(res, 404, "Content not found");
        }
        return (0, responseHandler_1.handleSuccess)(res, 200, "Content fetched successfully", content);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.get_contents = get_contents;
const updateContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updateSchema = joi_1.default.object({
            content_type: joi_1.default.string().valid("terms_and_service", "privacy_policy", "legal_notice").optional(),
            content: joi_1.default.string().optional()
        });
        const { error, value } = updateSchema.validate(req.body);
        if (error)
            return (0, responseHandler_1.joiErrorHandle)(res, error);
        const { content_type, content } = value;
        const contentRepo = (0, typeorm_1.getRepository)(ContentManagement_1.ContentManagement);
        const existingContent = yield contentRepo.findOne({ where: { content_type: content_type } });
        if (!existingContent) {
            return (0, responseHandler_1.handleError)(res, 404, "Content not found");
        }
        if (content_type)
            existingContent.content_type = content_type;
        if (content)
            existingContent.content = content;
        yield contentRepo.save(existingContent);
        return (0, responseHandler_1.handleSuccess)(res, 200, "Content updated successfully", existingContent);
    }
    catch (error) {
        return (0, responseHandler_1.handleError)(res, 500, error.message);
    }
});
exports.updateContent = updateContent;
