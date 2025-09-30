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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async createTeacher(createTeacherDto, req) {
        this.checkAdminRole(req.user.role);
        return this.adminService.createTeacher(createTeacherDto);
    }
    async createStudent(createStudentDto, req) {
        this.checkAdminRole(req.user.role);
        return this.adminService.createStudent(createStudentDto);
    }
    async grantCards(grantCardsDto, req) {
        this.checkAdminRole(req.user.role);
        return this.adminService.grantCards(grantCardsDto);
    }
    async getReports(query, req) {
        if (req.user.role === 'teacher') {
            query.teacherId = req.user.sub;
        }
        else {
            this.checkAdminRole(req.user.role);
        }
        return this.adminService.getReports(query);
    }
    checkAdminRole(role) {
        if (role !== 'admin') {
            throw new common_1.ForbiddenException('Admin access required');
        }
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Post)('teachers'),
    (0, swagger_1.ApiOperation)({ summary: '建立/上架教師' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '教師建立成功' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createTeacher", null);
__decorate([
    (0, common_1.Post)('students'),
    (0, swagger_1.ApiOperation)({ summary: '建立學生帳號' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '學生建立成功' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Post)('grant-cards'),
    (0, swagger_1.ApiOperation)({ summary: '授予學生卡片' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '卡片授予成功' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "grantCards", null);
__decorate([
    (0, common_1.Get)('reports'),
    (0, swagger_1.ApiOperation)({ summary: '管理員報表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '報表資料' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getReports", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map