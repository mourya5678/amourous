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
exports.PollResponse = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Poll_1 = require("./Poll");
const PollOption_1 = require("./PollOption");
let PollResponse = class PollResponse {
};
exports.PollResponse = PollResponse;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PollResponse.prototype, "poll_response_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true, onDelete: 'CASCADE' }),
    __metadata("design:type", User_1.User)
], PollResponse.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Poll_1.Poll, { nullable: true, onDelete: 'CASCADE' }),
    __metadata("design:type", Poll_1.Poll)
], PollResponse.prototype, "poll", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => PollOption_1.PollOption, { nullable: true, onDelete: 'CASCADE' }),
    __metadata("design:type", PollOption_1.PollOption)
], PollResponse.prototype, "poll_option", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', precision: 6 }),
    __metadata("design:type", Date)
], PollResponse.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', precision: 6 }),
    __metadata("design:type", Date)
], PollResponse.prototype, "updated_at", void 0);
exports.PollResponse = PollResponse = __decorate([
    (0, typeorm_1.Entity)()
], PollResponse);
