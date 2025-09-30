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
exports.TeachersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../entities/user.entity");
const teacher_profile_entity_1 = require("../entities/teacher-profile.entity");
let TeachersService = class TeachersService {
    constructor(userRepository, teacherProfileRepository) {
        this.userRepository = userRepository;
        this.teacherProfileRepository = teacherProfileRepository;
    }
    async findAll(query = {}) {
        const { page = 1, pageSize = 20, domain, region, q, sort } = query;
        const queryBuilder = this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.teacherProfile', 'profile')
            .where('user.role = :role', { role: user_entity_1.UserRole.TEACHER })
            .andWhere('user.active = :active', { active: true });
        if (domain) {
            queryBuilder.andWhere('JSON_CONTAINS(profile.domains, :domain)', {
                domain: JSON.stringify(domain)
            });
        }
        if (region) {
            queryBuilder.andWhere('JSON_CONTAINS(profile.regions, :region)', {
                region: JSON.stringify(region)
            });
        }
        if (q) {
            queryBuilder.andWhere('(user.name LIKE :search OR profile.intro LIKE :search)', { search: `%${q}%` });
        }
        if (sort) {
            const [field, order] = sort.split(':');
            queryBuilder.orderBy(`profile.${field}`, order.toUpperCase());
        }
        else {
            queryBuilder.orderBy('profile.rating', 'DESC');
        }
        const offset = (page - 1) * pageSize;
        queryBuilder.skip(offset).take(pageSize);
        const [items, total] = await queryBuilder.getManyAndCount();
        return {
            items: items.map(user => this.formatTeacherCard(user)),
            page,
            pageSize,
            total,
        };
    }
    async findById(id) {
        const user = await this.userRepository.findOne({
            where: { id, role: user_entity_1.UserRole.TEACHER, active: true },
            relations: ['teacherProfile'],
        });
        if (!user || !user.teacherProfile) {
            throw new Error('Teacher not found');
        }
        return this.formatTeacherDetail(user);
    }
    formatTeacherCard(user) {
        const profile = user.teacherProfile;
        return {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            rating: profile?.rating || 0,
            ratingsCount: profile?.ratingsCount || 0,
            experienceYears: profile?.experienceYears || 0,
            domains: profile?.domains || [],
            region: profile?.regions?.[0] || '',
            pricePer30min: profile?.unitPriceUsd || 5,
            nextAvailableAt: profile?.nextAvailableAt,
            introSnippet: profile?.intro?.substring(0, 100) + '...',
        };
    }
    formatTeacherDetail(user) {
        const profile = user.teacherProfile;
        return {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            intro: profile?.intro || '',
            certifications: profile?.certifications || [],
            experienceYears: profile?.experienceYears || 0,
            domains: profile?.domains || [],
            region: profile?.regions?.[0] || '',
            gallery: [],
            rating: profile?.rating || 0,
            ratingsBreakdown: profile?.ratingsBreakdown || {},
            languages: profile?.languages || [],
            pricePolicies: profile?.pricePolicies || [],
            meetingPreference: profile?.meetingPreference || {
                mode: 'zoom_personal',
                defaultUrl: null,
            },
        };
    }
};
exports.TeachersService = TeachersService;
exports.TeachersService = TeachersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(teacher_profile_entity_1.TeacherProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TeachersService);
//# sourceMappingURL=teachers.service.js.map