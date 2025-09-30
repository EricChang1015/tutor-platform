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
exports.Booking = exports.BookingSource = exports.BookingStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["SCHEDULED"] = "scheduled";
    BookingStatus["PENDING"] = "pending";
    BookingStatus["PENDING_TEACHER"] = "pending_teacher";
    BookingStatus["CANCELED"] = "canceled";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["NOSHOW"] = "noshow";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var BookingSource;
(function (BookingSource) {
    BookingSource["STUDENT"] = "student";
    BookingSource["ADMIN"] = "admin";
    BookingSource["TEACHER"] = "teacher";
    BookingSource["SYSTEM"] = "system";
})(BookingSource || (exports.BookingSource = BookingSource = {}));
let Booking = class Booking {
};
exports.Booking = Booking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Booking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'student_id' }),
    __metadata("design:type", String)
], Booking.prototype, "studentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'teacher_id' }),
    __metadata("design:type", String)
], Booking.prototype, "teacherId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'starts_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "startsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ends_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "endsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BookingStatus,
        default: BookingStatus.SCHEDULED,
    }),
    __metadata("design:type", String)
], Booking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: BookingSource,
        default: BookingSource.STUDENT,
    }),
    __metadata("design:type", String)
], Booking.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'material_id', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "materialId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'course_title', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "courseTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'meeting_url', nullable: true }),
    __metadata("design:type", String)
], Booking.prototype, "meetingUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_message_at', nullable: true }),
    __metadata("design:type", Date)
], Booking.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Booking.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.studentBookings),
    (0, typeorm_1.JoinColumn)({ name: 'student_id' }),
    __metadata("design:type", user_entity_1.User)
], Booking.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.teacherBookings),
    (0, typeorm_1.JoinColumn)({ name: 'teacher_id' }),
    __metadata("design:type", user_entity_1.User)
], Booking.prototype, "teacher", void 0);
exports.Booking = Booking = __decorate([
    (0, typeorm_1.Entity)('bookings')
], Booking);
//# sourceMappingURL=booking.entity.js.map