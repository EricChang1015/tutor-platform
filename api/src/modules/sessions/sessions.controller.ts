import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { SubmitTeacherReportDto } from './dto/submit-teacher-report.dto';
import { SubmitStudentGoalDto } from './dto/submit-student-goal.dto';
import { UploadProofDto } from './dto/upload-proof.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService
  ) {}

  @Get(':sessionId')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getSessionDetails(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.sessionsService.getSessionDetails(sessionId, req.user.sub, req.user.role);
  }

  @Put(':sessionId/meeting')
  @Roles(Role.Teacher)
  async updateMeetingInfo(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
    @Body() dto: UpdateMeetingDto
  ) {
    const teacherId = await this.getTeacherIdFromUser(req.user.sub);
    return this.sessionsService.updateMeetingInfo(sessionId, teacherId, dto);
  }

  @Post(':sessionId/teacher-report')
  @Roles(Role.Teacher)
  async submitTeacherReport(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
    @Body() dto: SubmitTeacherReportDto
  ) {
    const teacherId = await this.getTeacherIdFromUser(req.user.sub);
    return this.sessionsService.submitTeacherReport(sessionId, teacherId, dto);
  }

  @Post(':sessionId/student-goal')
  @Roles(Role.Student)
  async submitStudentGoal(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
    @Body() dto: SubmitStudentGoalDto
  ) {
    const studentId = await this.getStudentIdFromUser(req.user.sub);
    return this.sessionsService.submitStudentGoal(sessionId, studentId, dto);
  }

  @Post(':sessionId/proof')
  @Roles(Role.Teacher)
  async uploadProof(
    @Param('sessionId') sessionId: string,
    @Req() req: any,
    @Body() dto: UploadProofDto
  ) {
    const teacherId = await this.getTeacherIdFromUser(req.user.sub);
    return this.sessionsService.uploadProof(sessionId, teacherId, dto);
  }

  @Get(':sessionId/proofs')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async getSessionProofs(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.sessionsService.getSessionProofs(sessionId, req.user.sub, req.user.role);
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

  private async getStudentIdFromUser(userId: string): Promise<string> {
    const student = await this.prisma.student_profile.findUnique({
      where: { user_id: userId },
    });
    
    if (!student) {
      throw new Error('Student profile not found for user');
    }
    
    return student.id;
  }
}
