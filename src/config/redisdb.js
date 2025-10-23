"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connect_redis_database = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const connect_redis_database = () => {
    const redis = new ioredis_1.default({
        host: 'localhost',
        port: 6379,
        db: 0,
    });
    redis.on('connect', () => {
        console.log('Connected to Redis successfully!');
    });
    redis.on('error', (err) => {
        console.error('Redis connection error:', err);
    });
};
exports.connect_redis_database = connect_redis_database;
