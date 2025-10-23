"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallLogs = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let CallLogs = class CallLogs {
};
exports.CallLogs = CallLogs;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CallLogs.prototype, "call_logs_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true, onDelete: 'CASCADE' }),
    __metadata("design:type", User_1.User)
], CallLogs.prototype, "caller", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true, onDelete: 'CASCADE' }),
    __metadata("design:type", User_1.User)
], CallLogs.prototype, "receiver", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['audio', 'video'] }),
    __metadata("design:type", String)
], CallLogs.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CallLogs.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['missed', 'rejected', 'completed'] }),
    __metadata("design:type", String)
], CallLogs.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], CallLogs.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], CallLogs.prototype, "call_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CallLogs.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CallLogs.prototype, "updated_at", void 0);
exports.CallLogs = CallLogs = __decorate([
    (0, typeorm_1.Entity)()
], CallLogs);
