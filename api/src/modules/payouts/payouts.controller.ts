import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { PayoutsService } from './payouts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { GeneratePayoutDto } from './dto/generate-payout.dto';
import { UpdatePayoutDto } from './dto/update-payout.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutsController {
  constructor(
    private readonly payoutsService: PayoutsService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @Roles(Role.Admin)
  async generatePayout(@Body() dto: GeneratePayoutDto) {
    return this.payoutsService.generatePayout(dto);
  }

  @Get()
  @Roles(Role.Admin)
  async getAllPayouts() {
    return this.payoutsService.getAllPayouts();
  }

  @Get('my-payouts')
  @Roles(Role.Teacher)
  async getMyPayouts(@Req() req: any) {
    const teacherId = await this.getTeacherIdFromUser(req.user.sub);
    return this.payoutsService.getTeacherPayouts(teacherId);
  }

  @Get('teacher/:teacherId')
  @Roles(Role.Admin)
  async getTeacherPayouts(@Param('teacherId') teacherId: string) {
    return this.payoutsService.getTeacherPayouts(teacherId);
  }

  @Get(':payoutId')
  @Roles(Role.Admin, Role.Teacher)
  async getPayoutDetails(@Param('payoutId') payoutId: string, @Req() req: any) {
    const payout = await this.payoutsService.getPayoutDetails(payoutId);
    
    // 如果是老師，檢查是否是自己的 payout
    if (req.user.role === 'teacher') {
      const teacherId = await this.getTeacherIdFromUser(req.user.sub);
      if (payout.teacher.id !== teacherId) {
        throw new Error('You can only view your own payouts');
      }
    }
    
    return payout;
  }

  @Put(':payoutId')
  @Roles(Role.Admin)
  async updatePayout(@Param('payoutId') payoutId: string, @Body() dto: UpdatePayoutDto) {
    return this.payoutsService.updatePayout(payoutId, dto);
  }

  @Post('generate-monthly')
  @Roles(Role.Admin)
  async generateMonthlyPayouts(@Query('year') year: string, @Query('month') month: string) {
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error('Invalid year or month parameter');
    }

    return this.payoutsService.generateMonthlyPayouts(yearNum, monthNum);
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
