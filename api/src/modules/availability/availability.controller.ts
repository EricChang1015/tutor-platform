import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('availability')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @Roles(Role.Teacher)
  async createSlot(@Req() req: any, @Body() dto: CreateAvailabilityDto) {
    // 獲取當前用戶的 teacher_profile.id
    const teacherId = await this.getTeacherIdFromUser(req.user.sub);
    return this.availabilityService.createSlot(teacherId, dto);
  }

  @Get('my-slots')
  @Roles(Role.Teacher)
  async getMySlots(@Req() req: any) {
    const teacherId = await this.getTeacherIdFromUser(req.user.sub);
    return this.availabilityService.getTeacherSlots(teacherId);
  }

  @Get('teacher/:teacherId')
  @Roles(Role.Admin, Role.Student)
  async getTeacherSlots(@Param('teacherId') teacherId: string) {
    return this.availabilityService.getTeacherSlots(teacherId);
  }

  @Put(':slotId')
  @Roles(Role.Teacher)
  async updateSlot(
    @Param('slotId') slotId: string,
    @Req() req: any,
    @Body() dto: UpdateAvailabilityDto
  ) {
    const teacherId = await this.getTeacherIdFromUser(req.user.sub);
    return this.availabilityService.updateSlot(slotId, teacherId, dto);
  }

  @Delete(':slotId')
  @Roles(Role.Teacher)
  async deleteSlot(@Param('slotId') slotId: string, @Req() req: any) {
    const teacherId = await this.getTeacherIdFromUser(req.user.sub);
    return this.availabilityService.deleteSlot(slotId, teacherId);
  }

  private async getTeacherIdFromUser(userId: string): Promise<string> {
    const teacher = await this.prisma.teacher_profile.findUnique({
      where: { user_id: userId },
    });

    if (!teacher) {
      throw new Error('Teacher profile not found for user');
    }

    return teacher.id;
  }
}
