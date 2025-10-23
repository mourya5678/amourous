"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
//==================================== Import Routes ==============================
const api_1 = __importDefault(require("../routes/api"));
const admin_1 = __importDefault(require("../routes/admin"));
//==================================== configureApp ==============================
const configureApp = (app) => {
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, cookie_parser_1.default)());
    app.use((0, cors_1.default)());
    app.use("/api", api_1.default);
    app.use("/admin", admin_1.default);
};
exports.default = configureApp;
