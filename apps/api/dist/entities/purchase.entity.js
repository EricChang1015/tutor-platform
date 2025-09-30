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
exports.Purchase = exports.PurchaseStatus = exports.PurchaseType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var PurchaseType;
(function (PurchaseType) {
    PurchaseType["LESSON_CARD"] = "lesson_card";
    PurchaseType["TRIAL_CARD"] = "trial_card";
    PurchaseType["COMPENSATION_CARD"] = "compensation_card";
    PurchaseType["CANCEL_CARD"] = "cancel_card";
})(PurchaseType || (exports.PurchaseType = PurchaseType = {}));
var PurchaseStatus;
(function (PurchaseStatus) {
    PurchaseStatus["DRAFT"] = "draft";
    PurchaseStatus["ACTIVE"] = "active";
    PurchaseStatus["EXPIRED"] = "expired";
    PurchaseStatus["CONSUMED"] = "consumed";
})(PurchaseStatus || (exports.PurchaseStatus = PurchaseStatus = {}));
let Purchase = class Purchase {
};
exports.Purchase = Purchase;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Purchase.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id' }),
    __metadata("design:type", String)
], Purchase.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'package_name' }),
    __metadata("design:type", String)
], Purchase.prototype, "packageName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Purchase.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Purchase.prototype, "remaining", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PurchaseType,
    }),
    __metadata("design:type", String)
], Purchase.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'suggested_label', nullable: true }),
    __metadata("design:type", String)
], Purchase.prototype, "suggestedLabel", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'purchased_at' }),
    __metadata("design:type", Date)
], Purchase.prototype, "purchasedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'activated_at', nullable: true }),
    __metadata("design:type", Date)
], Purchase.prototype, "activatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', nullable: true }),
    __metadata("design:type", Date)
], Purchase.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PurchaseStatus,
        default: PurchaseStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], Purchase.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Purchase.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Purchase.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.purchases),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", user_entity_1.User)
], Purchase.prototype, "student", void 0);
exports.Purchase = Purchase = __decorate([
    (0, typeorm_1.Entity)('purchases')
], Purchase);
//# sourceMappingURL=purchase.entity.js.map