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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../entities/user.entity");
const teacher_profile_entity_1 = require("../entities/teacher-profile.entity");
const purchase_entity_1 = require("../entities/purchase.entity");
const booking_entity_1 = require("../entities/booking.entity");
let AdminService = class AdminService {
    constructor(userRepository, teacherProfileRepository, purchaseRepository, bookingRepository) {
        this.userRepository = userRepository;
        this.teacherProfileRepository = teacherProfileRepository;
        this.purchaseRepository = purchaseRepository;
        this.bookingRepository = bookingRepository;
    }
    async createTeacher(createTeacherDto) {
        const hashedPassword = await bcrypt.hash('teacher123', 10);
        const user = this.userRepository.create({
            email: createTeacherDto.email,
            passwordHash: hashedPassword,
            role: user_entity_1.UserRole.TEACHER,
            name: createTeacherDto.name,
            active: createTeacherDto.active ?? true,
        });
        const savedUser = await this.userRepository.save(user);
        const teacherProfile = this.teacherProfileRepository.create({
            userId: savedUser.id,
            intro: createTeacherDto.intro,
            certifications: createTeacherDto.certifications,
            experienceYears: createTeacherDto.experienceYears,
            domains: createTeacherDto.domains,
            regions: createTeacherDto.regions,
            unitPriceUsd: createTeacherDto.unitPriceUSD || 5.00,
        });
        await this.teacherProfileRepository.save(teacherProfile);
        return {
            id: savedUser.id,
            email: savedUser.email,
            name: savedUser.name,
            role: savedUser.role,
            active: savedUser.active,
            profile: teacherProfile,
        };
    }
    async createStudent(createStudentDto) {
        const hashedPassword = await bcrypt.hash('student123', 10);
        const user = this.userRepository.create({
            email: createStudentDto.email,
            passwordHash: hashedPassword,
            role: user_entity_1.UserRole.STUDENT,
            name: createStudentDto.name,
            active: createStudentDto.active ?? true,
        });
        const savedUser = await this.userRepository.save(user);
        return {
            id: savedUser.id,
            email: savedUser.email,
            name: savedUser.name,
            role: savedUser.role,
            active: savedUser.active,
        };
    }
    async grantCards(grantCardsDto) {
        const { studentId, packageName, quantity, type, notes } = grantCardsDto;
        const student = await this.userRepository.findOne({
            where: { id: studentId, role: user_entity_1.UserRole.STUDENT },
        });
        if (!student) {
            throw new Error('Student not found');
        }
        const purchase = this.purchaseRepository.create({
            studentId,
            packageName,
            quantity,
            remaining: quantity,
            type: type,
            status: purchase_entity_1.PurchaseStatus.DRAFT,
            notes,
            suggestedLabel: this.getSuggestedLabel(type),
        });
        const savedPurchase = await this.purchaseRepository.save(purchase);
        return {
            id: savedPurchase.id,
            studentId: savedPurchase.studentId,
            packageName: savedPurchase.packageName,
            quantity: savedPurchase.quantity,
            remaining: savedPurchase.remaining,
            type: savedPurchase.type,
            status: savedPurchase.status,
            purchasedAt: savedPurchase.purchasedAt,
        };
    }
    async getReports(query = {}) {
        const { from, to, teacherId } = query;
        return {
            totalBookings: 0,
            completedBookings: 0,
            canceledBookings: 0,
            completionRate: '0.00',
            cancellationRate: '0.00',
            technicalCancellationRate: '0.00',
            period: from && to ? `${from} to ${to}` : 'All time',
            teacherId: teacherId || 'All teachers',
            message: 'Reports feature is working. Database queries will be implemented later.',
        };
    }
    getSuggestedLabel(type) {
        switch (type) {
            case 'trial_card':
                return '新簽體驗課程';
            case 'lesson_card':
                return '建議升級';
            case 'compensation_card':
                return 'feedback課程補償';
            case 'cancel_card':
                return '取消約課次卡';
            default:
                return '';
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(teacher_profile_entity_1.TeacherProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __param(3, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map