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
exports.PostClassReport = void 0;
const typeorm_1 = require("typeorm");
let PostClassReport = class PostClassReport {
};
exports.PostClassReport = PostClassReport;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PostClassReport.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'booking_id' }),
    __metadata("design:type", String)
], PostClassReport.prototype, "bookingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teacher_report_submitted_at', nullable: true }),
    __metadata("design:type", Date)
], PostClassReport.prototype, "teacherReportSubmittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teacher_rubrics', type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], PostClassReport.prototype, "teacherRubrics", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'evidence_urls', type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], PostClassReport.prototype, "evidenceUrls", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_goal', type: 'text', nullable: true }),
    __metadata("design:type", String)
], PostClassReport.prototype, "studentGoal", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_goal_submitted_at', nullable: true }),
    __metadata("design:type", Date)
], PostClassReport.prototype, "studentGoalSubmittedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], PostClassReport.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], PostClassReport.prototype, "updatedAt", void 0);
exports.PostClassReport = PostClassReport = __decorate([
    (0, typeorm_1.Entity)('post_class_reports')
], PostClassReport);
//# sourceMappingURL=post-class-report.entity.js.map