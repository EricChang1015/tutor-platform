import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';

import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { MaterialType } from '../entities/material.entity';

@ApiTags('Materials')
@Controller('materials')
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Get()
  @ApiOperation({ summary: '查詢教材清單或資料夾樹' })
  @ApiQuery({ name: 'include', required: false, enum: ['all', 'root', 'flat'], description: '資料夾樹模式：all=完整樹狀, root=根目錄, flat=扁平清單' })
  @ApiQuery({ name: 'depth', required: false, type: 'number', description: '樹狀結構深度' })
  @ApiQuery({ name: 'type', required: false, enum: ['page', 'pdf'] })
  @ApiQuery({ name: 'folderId', required: false, type: 'string' })
  @ApiQuery({ name: 'q', required: false, description: '搜尋關鍵字' })
  @ApiQuery({ name: 'page', required: false, type: 'number' })
  @ApiQuery({ name: 'pageSize', required: false, type: 'number' })
  @ApiResponse({ status: 200, description: '教材清單或資料夾樹' })
  async getMaterials(@Query() query: any) {
    // 如果有 include 參數，返回資料夾樹結構
    if (query.include) {
      return this.materialsService.getLibraryTree(query);
    }
    // 否則返回教材清單
    return this.materialsService.findAll(query);
  }

  // 資料夾相關端點（放在 :id 之前以避免路由衝突）
  @Get('folders')
  @ApiOperation({ summary: '獲取所有資料夾' })
  @ApiResponse({ status: 200, description: '資料夾列表' })
  async getFolders() {
    return this.materialsService.getFolders();
  }

  @Post('folders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '建立資料夾' })
  @ApiResponse({ status: 201, description: '資料夾建立成功' })
  async createFolder(@Body() createFolderDto: CreateFolderDto, @Request() req) {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.materialsService.createFolder(createFolderDto);
  }

  @Patch('folders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新資料夾' })
  @ApiResponse({ status: 200, description: '資料夾更新成功' })
  @ApiResponse({ status: 404, description: '資料夾不存在' })
  async updateFolder(
    @Param('id') id: string,
    @Body() updateFolderDto: UpdateFolderDto,
    @Request() req,
  ) {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.materialsService.updateFolder(id, updateFolderDto);
  }

  @Delete('folders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '刪除資料夾' })
  @ApiResponse({ status: 204, description: '資料夾刪除成功' })
  @ApiResponse({ status: 404, description: '資料夾不存在' })
  @ApiResponse({ status: 400, description: '資料夾包含子項目，無法刪除' })
  async deleteFolder(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can delete folders');
    }

    await this.materialsService.deleteFolder(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得教材' })
  @ApiResponse({ status: 200, description: '教材詳細資料' })
  @ApiResponse({ status: 404, description: '教材不存在' })
  async getMaterial(@Param('id') id: string) {
    return this.materialsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '新增教材（支援檔案上傳）' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '教材建立成功' })
  @UseInterceptors(FileInterceptor('file'))
  async createMaterial(
    @Body() createMaterialDto: CreateMaterialDto,
    @UploadedFile() file: any,
    @Request() req
  ) {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // 驗證教材類型和檔案
    if (createMaterialDto.type === MaterialType.PDF && !file) {
      throw new BadRequestException('PDF materials require a file upload');
    }

    if (createMaterialDto.type === MaterialType.PAGE && file) {
      throw new BadRequestException('Page materials should not include file uploads');
    }

    return this.materialsService.createWithFile(req.user.sub, createMaterialDto, file);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新教材' })
  @ApiResponse({ status: 200, description: '教材更新成功' })
  @ApiResponse({ status: 404, description: '教材不存在' })
  async updateMaterial(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @Request() req,
  ) {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return this.materialsService.update(id, updateMaterialDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '刪除教材' })
  @ApiResponse({ status: 204, description: '教材刪除成功' })
  @ApiResponse({ status: 404, description: '教材不存在' })
  async deleteMaterial(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin can delete materials');
    }

    await this.materialsService.delete(id);
  }
}