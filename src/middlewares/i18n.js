"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessage = exports.i18nMiddleware = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const availableLanguages = ['en', 'es', 'fr'];
const translationsCache = {};
const loadTranslations = (lang) => {
    try {
        const translationsPath = path_1.default.join(__dirname, `../locales/${lang}.json`);
        if (translationsCache[lang]) {
            return translationsCache[lang];
        }
        if (fs_1.default.existsSync(translationsPath)) {
            const translations = JSON.parse(fs_1.default.readFileSync(translationsPath, 'utf-8'));
            translationsCache[lang] = translations;
            return translations;
        }
    }
    catch (error) {
        console.error(`Error loading translations for ${lang}:`, error);
    }
    return {};
};
const i18nMiddleware = (req, res, next) => {
    let lang = (req.headers['accept-language'] || 'en').split(',')[0].split('-')[0];
    if (!availableLanguages.includes(lang)) {
        lang = 'en';
    }
    const translations = loadTranslations(lang);
    req.t = (key) => translations[key] || key;
    next();
};
exports.i18nMiddleware = i18nMiddleware;
const getMessage = (lang, key) => {
    if (!availableLanguages.includes(lang)) {
        lang = 'en';
    }
    const translations = translationsCache[lang] || loadTranslations(lang);
    return translations[key] || key;
};
exports.getMessage = getMessage;
