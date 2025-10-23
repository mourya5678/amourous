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
exports.uploadToMemory = exports.deleteFileFromS3 = exports.upload_blurred = exports.upload = exports.s3 = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_s3_1 = __importDefault(require("multer-s3"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
const aws_s3_client_1 = __importDefault(require("./aws_s3_client"));
dotenv_1.default.config();
exports.s3 = new aws_sdk_1.default.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
exports.upload = (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: aws_s3_client_1.default,
        bucket: process.env.S3_BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `${Date.now()}_${file.originalname}`;
            cb(null, fileName);
        },
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        cacheControl: 'public, max-age=31536000',
        acl: 'public-read',
    }),
});
exports.upload_blurred = (0, multer_1.default)({
    storage: (0, multer_s3_1.default)({
        s3: aws_s3_client_1.default,
        bucket: process.env.S3_BUCKET_NAME,
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            const fileName = `processed/blurred-${Date.now()}.jpg`;
            cb(null, fileName);
        },
        contentType: multer_s3_1.default.AUTO_CONTENT_TYPE,
        cacheControl: 'public, max-age=31536000',
        acl: 'public-read',
    }),
});
const deleteFileFromS3 = (fileUrl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bucketName = process.env.S3_BUCKET_NAME;
        const urlParts = fileUrl.split('/');
        const key = urlParts.slice(3).join('/');
        const params = {
            Bucket: bucketName,
            Key: key,
        };
        yield exports.s3.deleteObject(params).promise();
        console.log(`Deleted: ${key}`);
    }
    catch (error) {
        console.error('Error deleting file from S3:', error);
        throw error;
    }
});

// exports.uploadFileToS3 = async (filePath, fileName, mimeType) => {
//     const fileContent = fs.readFileSync(filePath);

//     const params = {
//         Bucket: process.env.S3_BUCKET,
//         Key: `faces/${fileName}`,
//         Body: fileContent,
//         ContentType: mimeType,
//     };

//     const data = await s3.upload(params).promise();
//     return data.Location; // S3 URL
// };

const getPublicUrl = (fileKey) =>
    `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;


exports.deleteFileFromS3 = deleteFileFromS3;
exports.getPublicUrl = getPublicUrl;
const storage = multer_1.default.memoryStorage();
exports.uploadToMemory = (0, multer_1.default)({ storage });
