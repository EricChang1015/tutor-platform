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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const booking_entity_1 = require("../entities/booking.entity");
const user_entity_1 = require("../entities/user.entity");
const purchase_entity_1 = require("../entities/purchase.entity");
let BookingsService = class BookingsService {
    constructor(bookingRepository, userRepository, purchaseRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.purchaseRepository = purchaseRepository;
    }
    async findUserBookings(userId, query = {}) {
        const { page = 1, pageSize = 20, roleView, from, to, status, sort } = query;
        const queryBuilder = this.bookingRepository
            .createQueryBuilder('booking')
            .leftJoinAndSelect('booking.student', 'student')
            .leftJoinAndSelect('booking.teacher', 'teacher');
        if (roleView === 'student') {
            queryBuilder.where('booking.studentId = :userId', { userId });
        }
        else if (roleView === 'teacher') {
            queryBuilder.where('booking.teacherId = :userId', { userId });
        }
        else {
            queryBuilder.where('(booking.studentId = :userId OR booking.teacherId = :userId)', { userId });
        }
        if (from) {
            queryBuilder.andWhere('booking.startsAt >= :from', { from });
        }
        if (to) {
            queryBuilder.andWhere('booking.startsAt <= :to', { to });
        }
        if (status) {
            if (status === 'upcoming') {
                queryBuilder.andWhere('booking.startsAt > NOW()');
                queryBuilder.andWhere('booking.status IN (:...statuses)', {
                    statuses: [booking_entity_1.BookingStatus.SCHEDULED, booking_entity_1.BookingStatus.PENDING]
                });
            }
            else if (status === 'past') {
                queryBuilder.andWhere('booking.startsAt <= NOW()');
                queryBuilder.andWhere('booking.status = :status', {
                    status: booking_entity_1.BookingStatus.COMPLETED
                });
            }
            else if (status === 'canceled') {
                queryBuilder.andWhere('booking.status = :status', {
                    status: booking_entity_1.BookingStatus.CANCELED
                });
            }
            else if (status === 'pending') {
                queryBuilder.andWhere('booking.status IN (:...statuses)', {
                    statuses: [booking_entity_1.BookingStatus.PENDING, booking_entity_1.BookingStatus.PENDING_TEACHER]
                });
            }
        }
        if (sort) {
            const [field, order] = sort.split(':');
            queryBuilder.orderBy(`booking.${field}`, order.toUpperCase());
        }
        else {
            queryBuilder.orderBy('booking.startsAt', 'DESC');
        }
        const offset = (page - 1) * pageSize;
        queryBuilder.skip(offset).take(pageSize);
        const [items, total] = await queryBuilder.getManyAndCount();
        return {
            items: items.map(booking => this.formatBookingSummary(booking)),
            page,
            pageSize,
            total,
        };
    }
    async createBooking(createBookingDto, userId) {
        const booking = this.bookingRepository.create({
            studentId: createBookingDto.studentId || userId,
            teacherId: createBookingDto.teacherId,
            startsAt: new Date(createBookingDto.startsAt),
            endsAt: new Date(new Date(createBookingDto.startsAt).getTime() + createBookingDto.durationMinutes * 60000),
            status: booking_entity_1.BookingStatus.SCHEDULED,
            source: createBookingDto.source || 'student',
            materialId: createBookingDto.materialId,
            courseTitle: createBookingDto.courseTitle,
            message: createBookingDto.message,
        });
        const savedBooking = await this.bookingRepository.save(booking);
        return this.findById(savedBooking.id);
    }
    async findById(id) {
        const booking = await this.bookingRepository.findOne({
            where: { id },
            relations: ['student', 'teacher'],
        });
        if (!booking) {
            throw new Error('Booking not found');
        }
        return this.formatBookingDetail(booking);
    }
    formatBookingSummary(booking) {
        return {
            id: booking.id,
            teacher: {
                id: booking.teacher.id,
                name: booking.teacher.name,
                avatarUrl: booking.teacher.avatarUrl,
            },
            student: {
                id: booking.student.id,
                name: booking.student.name,
            },
            startsAt: booking.startsAt,
            endsAt: booking.endsAt,
            status: booking.status,
            materialId: booking.materialId,
            lastMessageAt: booking.lastMessageAt,
            meetingUrl: booking.meetingUrl,
            source: booking.source,
        };
    }
    formatBookingDetail(booking) {
        return {
            ...this.formatBookingSummary(booking),
            courseTitle: booking.courseTitle,
            message: booking.message,
            messages: [],
            canReschedule: this.canReschedule(booking),
            canCancel: this.canCancel(booking),
            cancelPolicy: this.getCancelPolicy(),
            settlement: null,
            postClass: null,
        };
    }
    canReschedule(booking) {
        return booking.status === booking_entity_1.BookingStatus.SCHEDULED && booking.startsAt > new Date();
    }
    canCancel(booking) {
        return booking.status === booking_entity_1.BookingStatus.SCHEDULED && booking.startsAt > new Date();
    }
    getCancelPolicy() {
        return {
            freeBeforeHours: 24,
            tiered: [
                { minHours: 12, maxHours: 24, cancelCardCost: 1 },
                { minHours: 2, maxHours: 12, cancelCardCost: 2 },
            ],
        };
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(booking_entity_1.Booking)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map