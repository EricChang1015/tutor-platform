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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { MaterialsService } from './materials.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

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
  @ApiOperation({ summary: '新增教材' })
  @ApiResponse({ status: 201, description: '教材建立成功' })
  async createMaterial(@Body() createMaterialDto: CreateMaterialDto, @Request() req) {
    if (!['admin', 'teacher'].includes(req.user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return this.materialsService.create(createMaterialDto);
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