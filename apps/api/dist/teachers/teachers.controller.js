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
exports.TeachersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const teachers_service_1 = require("./teachers.service");
let TeachersController = class TeachersController {
    constructor(teachersService) {
        this.teachersService = teachersService;
    }
    async getTeachers(query) {
        return this.teachersService.findAll(query);
    }
    async getTeacher(id) {
        return this.teachersService.findById(id);
    }
};
exports.TeachersController = TeachersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '教師清單' }),
    (0, swagger_1.ApiQuery)({ name: 'domain', required: false, description: '教學領域' }),
    (0, swagger_1.ApiQuery)({ name: 'region', required: false, description: '教學地區' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: '搜尋關鍵字' }),
    (0, swagger_1.ApiQuery)({ name: 'sort', required: false, description: '排序方式' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: '頁數' }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', required: false, description: '每頁筆數' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '教師清單' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getTeachers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '教師詳細資訊' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '教師詳細資訊' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '教師不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeachersController.prototype, "getTeacher", null);
exports.TeachersController = TeachersController = __decorate([
    (0, swagger_1.ApiTags)('Teachers'),
    (0, common_1.Controller)('teachers'),
    __metadata("design:paramtypes", [teachers_service_1.TeachersService])
], TeachersController);
//# sourceMappingURL=teachers.controller.js.map