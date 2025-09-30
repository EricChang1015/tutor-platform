import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('teachers')
  @ApiOperation({ summary: '建立/上架教師' })
  @ApiResponse({ status: 201, description: '教師建立成功' })
  async createTeacher(@Body() createTeacherDto: any, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.adminService.createTeacher(createTeacherDto);
  }

  @Post('students')
  @ApiOperation({ summary: '建立學生帳號' })
  @ApiResponse({ status: 201, description: '學生建立成功' })
  async createStudent(@Body() createStudentDto: any, @Request() req) {
    this.checkAdminRole(req.user.role);
    return this.adminService.createStudent(createStudentDto);
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

  private checkAdminRole(role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
  }
}
