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
exports.TeacherProfile = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let TeacherProfile = class TeacherProfile {
};
exports.TeacherProfile = TeacherProfile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TeacherProfile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id' }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], TeacherProfile.prototype, "intro", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "certifications", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'experience_years', default: 0 }),
    __metadata("design:type", Number)
], TeacherProfile.prototype, "experienceYears", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "domains", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json' }),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "regions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "languages", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'price_policies', type: 'json', nullable: true }),
    __metadata("design:type", Array)
], TeacherProfile.prototype, "pricePolicies", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_price_usd', type: 'decimal', precision: 10, scale: 2, default: 5.00 }),
    __metadata("design:type", Number)
], TeacherProfile.prototype, "unitPriceUsd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meeting_preference', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "meetingPreference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, default: 0.00 }),
    __metadata("design:type", Number)
], TeacherProfile.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ratings_count', default: 0 }),
    __metadata("design:type", Number)
], TeacherProfile.prototype, "ratingsCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ratings_breakdown', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], TeacherProfile.prototype, "ratingsBreakdown", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_available_at', nullable: true }),
    __metadata("design:type", Date)
], TeacherProfile.prototype, "nextAvailableAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], TeacherProfile.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], TeacherProfile.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => user_entity_1.User, (user) => user.teacherProfile),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], TeacherProfile.prototype, "user", void 0);
exports.TeacherProfile = TeacherProfile = __decorate([
    (0, typeorm_1.Entity)('teacher_profiles')
], TeacherProfile);
//# sourceMappingURL=teacher-profile.entity.js.map