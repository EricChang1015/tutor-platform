import { Controller, Get, Param, Query, Put, Body, UseGuards, Request, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { TeachersService } from './teachers.service';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Teachers')
@Controller('teachers')
export class TeachersController {
  constructor(private teachersService: TeachersService) {}

  @Get()
  @ApiOperation({ summary: '教師清單' })
  @ApiQuery({ name: 'domain', required: false, description: '教學領域' })
  @ApiQuery({ name: 'region', required: false, description: '教學地區' })
  @ApiQuery({ name: 'q', required: false, description: '搜尋關鍵字' })
  @ApiQuery({ name: 'sort', required: false, description: '排序方式' })
  @ApiQuery({ name: 'page', required: false, description: '頁數' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每頁筆數' })
  @ApiResponse({ status: 200, description: '教師清單' })
  async getTeachers(@Query() query: any) {
    return this.teachersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '教師詳細資訊' })
  @ApiResponse({ status: 200, description: '教師詳細資訊' })
  @ApiResponse({ status: 404, description: '教師不存在' })
  async getTeacher(@Param('id') id: string) {
    return this.teachersService.findById(id);
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '獲取教師完整個人資料（私人）' })
  @ApiResponse({ status: 200, description: '教師個人資料' })
  @ApiResponse({ status: 401, description: '未授權' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async getTeacherProfile(
    @Param('id') id: string,
    @Request() req,
  ) {
    // 檢查權限：只能查看自己的完整資料（管理員除外）
    if (req.user.role !== 'admin' && id !== req.user.sub) {
      throw new BadRequestException('Can only view own profile');
    }

    return this.teachersService.getTeacherProfile(id);
  }

  @Put(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新教師個人資料' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授權' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async updateTeacherProfile(
    @Param('id') id: string,
    @Body() updateTeacherProfileDto: UpdateTeacherProfileDto,
    @Request() req,
  ) {
    // 檢查權限：只能修改自己的資料（管理員除外）
    if (req.user.role !== 'admin' && id !== req.user.sub) {
      throw new BadRequestException('Can only update own profile');
    }

    return this.teachersService.updateTeacherProfile(id, updateTeacherProfileDto);
  }

  @Post(':id/gallery')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: '上傳教師相簿檔案' })
  @ApiResponse({ status: 200, description: '上傳成功' })
  @ApiResponse({ status: 401, description: '未授權' })
  @ApiResponse({ status: 403, description: '權限不足' })
  async uploadGalleryFile(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req,
  ) {
    // 檢查權限：只能上傳到自己的相簿（管理員除外）
    if (req.user.role !== 'admin' && id !== req.user.sub) {
      throw new BadRequestException('Can only upload to own gallery');
    }

    return this.teachersService.uploadGalleryFile(id, file);
  }

  @Get(':id/gallery')
  @ApiOperation({ summary: '獲取教師相簿' })
  @ApiResponse({ status: 200, description: '教師相簿' })
  async getTeacherGallery(@Param('id') id: string) {
    return this.teachersService.getTeacherGallery(id);
  }
}
