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
exports.LibraryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const library_service_1 = require("./library.service");
let LibraryController = class LibraryController {
    constructor(libraryService) {
        this.libraryService = libraryService;
    }
    async getLibrary(query) {
        return this.libraryService.getLibrary(query);
    }
    async getMaterial(id) {
        return this.libraryService.getMaterial(id);
    }
};
exports.LibraryController = LibraryController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '取得教材資料夾樹或扁平清單' }),
    (0, swagger_1.ApiQuery)({ name: 'include', required: false, enum: ['all', 'root', 'flat'] }),
    (0, swagger_1.ApiQuery)({ name: 'depth', required: false, type: 'number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '教材庫資料' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "getLibrary", null);
__decorate([
    (0, common_1.Get)('materials/:id'),
    (0, swagger_1.ApiOperation)({ summary: '取得教材詳細內容' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '教材詳細資料' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '教材不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "getMaterial", null);
exports.LibraryController = LibraryController = __decorate([
    (0, swagger_1.ApiTags)('Library'),
    (0, common_1.Controller)('library'),
    __metadata("design:paramtypes", [library_service_1.LibraryService])
], LibraryController);
//# sourceMappingURL=library.controller.js.map