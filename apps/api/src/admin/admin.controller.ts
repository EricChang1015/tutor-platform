import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiParam } from '@nestjs/swagger';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto, CreateTeacherDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateTeacherProfileDto, ResetPasswordDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // === 用戶管理功能 ===

  @Get('users')
  @ApiOperation({ summary: '獲取用戶列表' })
  @ApiResponse({ status: 200, description: '用戶列表' })
  async getUsers(@Query() query: UserQueryDto, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '獲取用戶詳細資料' })
  @ApiParam({ name: 'id', description: '用戶ID' })
  @ApiResponse({ status: 200, description: '用戶詳細資料' })
  @ApiResponse({ status: 404, description: '用戶不存在' })
  async getUser(@Param('id') id: string, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @ApiOperation({ summary: '創建新用戶' })
  @ApiResponse({ status: 201, description: '用戶創建成功' })
  async createUser(@Body() createUserDto: CreateUserDto, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.adminService.createUser(createUserDto);
  }

  @Post('teachers')
  @ApiOperation({ summary: '創建教師（包含教師檔案）' })
  @ApiResponse({ status: 201, description: '教師建立成功' })
  async createTeacher(@Body() createTeacherDto: CreateTeacherDto, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.adminService.createTeacherWithProfile(createTeacherDto);
  }

  @Put('users/:id')
  @ApiOperation({ summary: '更新用戶基本資料' })
  @ApiParam({ name: 'id', description: '用戶ID' })
  @ApiResponse({ status: 200, description: '用戶更新成功' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ) {
    this.checkAdminRole(req.user.role);
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Put('teachers/:id/profile')
  @ApiOperation({ summary: '更新教師檔案' })
  @ApiParam({ name: 'id', description: '教師ID' })
  @ApiResponse({ status: 200, description: '教師檔案更新成功' })
  async updateTeacherProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateTeacherProfileDto,
    @Request() req
  ) {
    this.checkAdminRole(req.user.role);
    return this.adminService.updateTeacherProfile(id, updateProfileDto);
  }

  @Post('users/:id/reset-password')
  @ApiOperation({ summary: '重置用戶密碼' })
  @ApiParam({ name: 'id', description: '用戶ID' })
  @ApiResponse({ status: 200, description: '密碼重置成功' })
  async resetUserPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
    @Request() req
  ) {
    this.checkAdminRole(req.user.role);
    return this.adminService.resetUserPassword(id, resetPasswordDto);
  }

  @Post('teachers/:id/gallery')
  @ApiOperation({ summary: '為教師上傳相簿檔案' })
  @ApiParam({ name: 'id', description: '教師ID' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '檔案上傳成功' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadTeacherGalleryFile(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Request() req
  ) {
    this.checkAdminRole(req.user.role);
    return this.adminService.uploadTeacherGalleryFile(id, file);
  }

  @Delete('teachers/:teacherId/gallery/:fileId')
  @ApiOperation({ summary: '刪除教師相簿檔案' })
  @ApiParam({ name: 'teacherId', description: '教師ID' })
  @ApiParam({ name: 'fileId', description: '檔案ID' })
  @ApiResponse({ status: 200, description: '檔案刪除成功' })
  async deleteTeacherGalleryFile(
    @Param('teacherId') teacherId: string,
    @Param('fileId') fileId: string,
    @Request() req
  ) {
    this.checkAdminRole(req.user.role);
    return this.adminService.deleteTeacherGalleryFile(teacherId, fileId);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: '刪除用戶（軟刪除）' })
  @ApiParam({ name: 'id', description: '用戶ID' })
  @ApiResponse({ status: 200, description: '用戶刪除成功' })
  async deleteUser(@Param('id') id: string, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.adminService.deleteUser(id);
  }

  @Post('grant-cards')
  @ApiOperation({ summary: '授予學生卡片' })
  @ApiResponse({ status: 201, description: '卡片授予成功' })
  async grantCards(@Body() grantCardsDto: any, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.adminService.grantCards(grantCardsDto);
  }

  @Get('reports')
  @ApiOperation({ summary: '管理員報表' })
  @ApiResponse({ status: 200, description: '報表資料' })
  async getReports(@Query() query: any, @Request() req) {
    // 管理員可以查看所有報表，教師只能查看自己的
    if (req.user.role === 'teacher') {
      query.teacherId = req.user.sub;
    } else {
      this.checkAdminRole(req.user.role);
    }

    return this.adminService.getReports(query);
  }

  @Post('reset-data')
  @ApiOperation({ summary: '重置系統資料到初始狀態' })
  @ApiResponse({ status: 200, description: '資料重置成功' })
  async resetData(@Request() req) {
    this.checkAdminRole(req.user.role);

    await this.adminService.resetSystemData();
    return { message: 'System data has been reset to initial state' };
  }

  private checkAdminRole(role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }
}
