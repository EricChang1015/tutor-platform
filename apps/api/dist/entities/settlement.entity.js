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
exports.Settlement = exports.SettlementStatus = void 0;
const typeorm_1 = require("typeorm");
var SettlementStatus;
(function (SettlementStatus) {
    SettlementStatus["PENDING"] = "pending";
    SettlementStatus["BLOCKED"] = "blocked";
    SettlementStatus["READY"] = "ready";
    SettlementStatus["SETTLED"] = "settled";
})(SettlementStatus || (exports.SettlementStatus = SettlementStatus = {}));
let Settlement = class Settlement {
};
exports.Settlement = Settlement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Settlement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'booking_id' }),
    __metadata("design:type", String)
], Settlement.prototype, "bookingId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SettlementStatus,
        default: SettlementStatus.PENDING,
    }),
    __metadata("design:type", String)
], Settlement.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teacher_unit_usd', type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Settlement.prototype, "teacherUnitUsd", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'payable_at', nullable: true }),
    __metadata("design:type", Date)
], Settlement.prototype, "payableAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'settled_at', nullable: true }),
    __metadata("design:type", Date)
], Settlement.prototype, "settledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Settlement.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Settlement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Settlement.prototype, "updatedAt", void 0);
exports.Settlement = Settlement = __decorate([
    (0, typeorm_1.Entity)('settlements')
], Settlement);
//# sourceMappingURL=settlement.entity.js.map