import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('booking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly prisma: PrismaService
  ) {}

  @Post()
  @Roles(Role.Student)
  async createBooking(@Req() req: any, @Body() dto: CreateBookingDto) {
    const studentId = await this.getStudentIdFromUser(req.user.sub);
    return this.bookingService.createBooking(studentId, dto);
  }

  @Get('my-bookings')
  @Roles(Role.Student)
  async getMyBookings(@Req() req: any) {
    const studentId = await this.getStudentIdFromUser(req.user.sub);
    return this.bookingService.getStudentBookings(studentId);
  }

  @Get('my-sessions')
  @Roles(Role.Teacher)
  async getMySessions(@Req() req: any) {
    const teacherId = await this.getTeacherIdFromUser(req.user.sub);
    return this.bookingService.getTeacherBookings(teacherId);
  }

  @Get('student/:studentId')
  @Roles(Role.Admin)
  async getStudentBookings(@Param('studentId') studentId: string) {
    return this.bookingService.getStudentBookings(studentId);
  }

  @Get('teacher/:teacherId')
  @Roles(Role.Admin)
  async getTeacherBookings(@Param('teacherId') teacherId: string) {
    return this.bookingService.getTeacherBookings(teacherId);
  }

  @Put(':sessionId/cancel')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async cancelBooking(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
    @Body() dto: CancelBookingDto
  ) {
    return this.bookingService.cancelBooking(sessionId, req.user.sub, req.user.role, dto);
  }

  private async getStudentIdFromUser(userId: string): Promise<string> {
    const student = await this.prisma.student_profile.findUnique({
      where: { user_id: userId },
    });
    
    if (!student) {
      throw new Error('Student profile not found for user');
    }
    
    return student.id;
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
