import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { CreatePackageDto } from './dto/create-package.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackagesController {
  constructor(private readonly packages: PackagesService) {}

  // Admin 手動加堂（建立套裝課）
  @Post('packages')
  @Roles(Role.Admin)
  async create(@Body() dto: CreatePackageDto) {
    return this.packages.createPackage({
      studentId: dto.studentId,
      courseId: dto.courseId,
      totalSessions: dto.totalSessions,
      notes: dto.notes,
    });
  }

  // 取得學生堂數摘要（套裝剩餘 + credits 彙總）
  @Get('students/:id/packages/summary')
  @Roles(Role.Admin)
  async getSummary(@Param('id') studentId: string) {
    return this.packages.getStudentSummary(studentId);
  }
}

