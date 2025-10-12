import { Controller, Get, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from '../admin/admin.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private adminService: AdminService) {}

  @Get('admin')
  @ApiOperation({ summary: '管理員報表（全域）' })
  async adminReports(@Request() req, @Query() query: any) {
    if (req.user?.role !== 'admin') throw new ForbiddenException('Admin only');
    return this.adminService.getReports(query);
  }

  @Get('teacher')
  @ApiOperation({ summary: '老師報表（僅自己）' })
  async teacherReports(@Request() req, @Query() query: any) {
    if (req.user?.role !== 'teacher' && req.user?.role !== 'admin') throw new ForbiddenException('Teacher only');
    const q = { ...query, teacherId: req.user.sub };
    return this.adminService.getReports(q);
  }
}

