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
exports.ContactSupport = void 0;

const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let ContactSupport = class ContactSupport { };
exports.ContactSupport = ContactSupport;

__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ContactSupport.prototype, "id", void 0);

__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", User_1.User)
], ContactSupport.prototype, "user_id", void 0);

// __decorate([
//     (0, typeorm_1.Column)({ type: "int", nullable: true }),
//     __metadata("design:type", Number)
// ], ContactSupport.prototype, "user_id", void 0);

__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], ContactSupport.prototype, "email", void 0);

__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], ContactSupport.prototype, "phone_number", void 0);

__decorate([
    (0, typeorm_1.Column)({ type: "longtext", nullable: true }),
    __metadata("design:type", String)
], ContactSupport.prototype, "message", void 0);

__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "datetime" }),
    __metadata("design:type", Date)
], ContactSupport.prototype, "createdAt", void 0);

__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "datetime" }),
    __metadata("design:type", Date)
], ContactSupport.prototype, "updatedAt", void 0);

exports.ContactSupport = ContactSupport = __decorate([
    (0, typeorm_1.Entity)("contact_supports")
], ContactSupport);
