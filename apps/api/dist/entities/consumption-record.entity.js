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
exports.ConsumptionRecord = exports.ConsumptionReason = void 0;
const typeorm_1 = require("typeorm");
const booking_entity_1 = require("./booking.entity");
const user_entity_1 = require("./user.entity");
const purchase_entity_1 = require("./purchase.entity");
var ConsumptionReason;
(function (ConsumptionReason) {
    ConsumptionReason["BOOKING"] = "booking";
    ConsumptionReason["CANCEL_TIER_1"] = "cancel_tier_1";
    ConsumptionReason["CANCEL_TIER_2"] = "cancel_tier_2";
    ConsumptionReason["CANCEL_TIER_LOCKED"] = "cancel_tier_locked";
    ConsumptionReason["ADMIN_ADJUST"] = "admin_adjust";
    ConsumptionReason["REFUND"] = "refund";
})(ConsumptionReason || (exports.ConsumptionReason = ConsumptionReason = {}));
let ConsumptionRecord = class ConsumptionRecord {
};
exports.ConsumptionRecord = ConsumptionRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ConsumptionRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'booking_id', nullable: true }),
    __metadata("design:type", String)
], ConsumptionRecord.prototype, "bookingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id' }),
    __metadata("design:type", String)
], ConsumptionRecord.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'purchase_id' }),
    __metadata("design:type", String)
], ConsumptionRecord.prototype, "purchaseId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: purchase_entity_1.PurchaseType,
    }),
    __metadata("design:type", String)
], ConsumptionRecord.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], ConsumptionRecord.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ConsumptionReason,
    }),
    __metadata("design:type", String)
], ConsumptionRecord.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ConsumptionRecord.prototype, "meta", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ConsumptionRecord.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => booking_entity_1.Booking, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'booking_id' }),
    __metadata("design:type", booking_entity_1.Booking)
], ConsumptionRecord.prototype, "booking", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", user_entity_1.User)
], ConsumptionRecord.prototype, "student", void 0);
exports.ConsumptionRecord = ConsumptionRecord = __decorate([
    (0, typeorm_1.Entity)('consumption_records')
], ConsumptionRecord);
//# sourceMappingURL=consumption-record.entity.js.map