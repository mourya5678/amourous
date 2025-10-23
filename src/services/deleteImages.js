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
exports.deleteImageFile = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const deleteImageFile = (entityOrName, id, filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let repository;
        if (typeof entityOrName === 'string') {
            repository = (0, typeorm_1.getRepository)(entityOrName);
        }
        else if (entityOrName instanceof Function) {
            repository = (0, typeorm_1.getRepository)(entityOrName);
        }
        else {
            throw Error('Invalid entity or entity name provided');
        }
        const document = yield repository.findOne({ where: { id: id } });
        if (!document) {
            throw Error(`Document with ID ${id} not found`);
        }
        const keys = filePath.split('.');
        const imageName = keys.reduce((obj, key) => obj && obj[key] !== 'undefined' ? obj[key] : undefined, document);
        if (!imageName) {
            console.log('No image field found in the document');
            return;
        }
        const uploadsFolderPath = path_1.default.join(__dirname, '..', 'uploads');
        const imagePath = path_1.default.join(uploadsFolderPath, imageName);
        console.log('Uploads folder path:', uploadsFolderPath);
        console.log('Full image path:', imagePath);
        if (fs_extra_1.default.existsSync(imagePath)) {
            yield fs_extra_1.default.unlink(imagePath);
            console.log(`Image file ${imageName} deleted successfully`);
            yield repository.update(id, { image: null });
        }
        else {
            console.log(`Image file ${imageName} not found in the uploads folder`);
        }
    }
    catch (error) {
        console.error('Error deleting image file:', error);
        throw Error('Internal Server Error');
    }
});
exports.deleteImageFile = deleteImageFile;
let file_name = "1724666263114-image_2024_08_23T08_11_56_348Z.png";
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("hello");
    yield (0, exports.deleteImageFile)(User_1.User, 1, file_name);
}))();
