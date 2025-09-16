import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';

@Injectable()
export class BookingService {
  constructor(private prisma: PrismaService) {}

  async createBooking(studentId: string, dto: CreateBookingDto) {
    // 驗證學生存在
    const student = await this.prisma.student_profile.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // 驗證課程存在且活躍
    const course = await this.prisma.course.findUnique({
      where: { id: dto.course_id },
    });
    if (!course || !course.active) {
      throw new NotFoundException('Course not found or inactive');
    }

    // 驗證老師存在
    const teacher = await this.prisma.teacher_profile.findUnique({
      where: { id: dto.teacher_id },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // 驗證時間
    const startAt = new Date(dto.start_at);
    const endAt = new Date(dto.end_at);
    
    if (startAt >= endAt) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (startAt <= new Date()) {
      throw new BadRequestException('Cannot book sessions in the past');
    }

    // 檢查老師在該時段是否有可用性
    await this.checkTeacherAvailability(dto.teacher_id, startAt, endAt);

    // 檢查學生是否有足夠的課程包餘額
    await this.checkStudentBalance(studentId, dto.course_id);

    // 檢查時間衝突
    await this.checkTimeConflict(dto.teacher_id, startAt, endAt);

    return this.prisma.$transaction(async (tx) => {
      // 創建 session
      const session = await tx.session.create({
        data: {
          course_id: dto.course_id,
          teacher_id: dto.teacher_id,
          start_at: startAt,
          end_at: endAt,
          capacity: 1,
          status: 'confirmed',
          meeting_url: dto.meeting_url,
          meeting_passcode: dto.meeting_passcode,
          created_by: 'student',
        },
      });

      // 創建 session_attendee
      await tx.session_attendee.create({
        data: {
          session_id: session.id,
          student_id: studentId,
          status: 'booked',
        },
      });

      // 扣除學生課程包餘額
      await this.deductStudentBalance(tx, studentId, dto.course_id, session.id);

      return this.formatSession(session);
    });
  }

  async getStudentBookings(studentId: string) {
    const student = await this.prisma.student_profile.findUnique({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const attendees = await this.prisma.session_attendee.findMany({
      where: { student_id: studentId },
      include: {
        session: {
          include: {
            course: true,
            teacher_profile: {
              include: {
                app_user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        session: { start_at: 'desc' },
      },
    });

    return attendees.map(attendee => ({
      id: attendee.session.id,
      course: {
        id: attendee.session.course.id,
        title: attendee.session.course.title,
      },
      teacher: {
        id: attendee.session.teacher_profile.id,
        name: attendee.session.teacher_profile.app_user.name,
        email: attendee.session.teacher_profile.app_user.email,
      },
      start_at: attendee.session.start_at.toISOString(),
      end_at: attendee.session.end_at.toISOString(),
      status: attendee.session.status,
      attendee_status: attendee.status,
      meeting_url: attendee.session.meeting_url,
      meeting_passcode: attendee.session.meeting_passcode,
      created_at: attendee.session.created_at.toISOString(),
    }));
  }

  async getTeacherBookings(teacherId: string) {
    const teacher = await this.prisma.teacher_profile.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const sessions = await this.prisma.session.findMany({
      where: { teacher_id: teacherId },
      include: {
        course: true,
        session_attendee: {
          include: {
            student_profile: {
              include: {
                app_user: {
                  select: { name: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { start_at: 'desc' },
    });

    return sessions.map(session => ({
      id: session.id,
      course: {
        id: session.course.id,
        title: session.course.title,
      },
      students: session.session_attendee.map(attendee => ({
        id: attendee.student_profile.id,
        name: attendee.student_profile.app_user.name,
        email: attendee.student_profile.app_user.email,
        status: attendee.status,
      })),
      start_at: session.start_at.toISOString(),
      end_at: session.end_at.toISOString(),
      status: session.status,
      meeting_url: session.meeting_url,
      meeting_passcode: session.meeting_passcode,
      created_at: session.created_at.toISOString(),
    }));
  }

  async cancelBooking(sessionId: string, userId: string, userRole: string, dto: CancelBookingDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        session_attendee: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status === 'cancelled') {
      throw new BadRequestException('Session is already cancelled');
    }

    // 檢查權限
    const canCancel = await this.checkCancelPermission(session, userId, userRole);
    if (!canCancel) {
      throw new ForbiddenException('You do not have permission to cancel this session');
    }

    const now = new Date();
    const sessionStart = new Date(session.start_at);
    const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    return this.prisma.$transaction(async (tx) => {
      // 更新 session 狀態
      await tx.session.update({
        where: { id: sessionId },
        data: {
          status: 'cancelled',
          cancel_reason: dto.reason,
          technical_issue: dto.technical_issue || false,
        },
      });

      // 處理退款邏輯
      for (const attendee of session.session_attendee) {
        await this.handleRefund(tx, attendee.student_id, session, hoursUntilSession, dto.technical_issue);
      }

      return { ok: true, message: 'Session cancelled successfully' };
    });
  }

  private async checkTeacherAvailability(teacherId: string, startAt: Date, endAt: Date) {
    const weekday = startAt.getDay();
    const startTime = startAt.toTimeString().substr(0, 5);
    const endTime = endAt.toTimeString().substr(0, 5);

    const availableSlots = await this.prisma.availability_slot.findMany({
      where: {
        teacher_id: teacherId,
        weekday: weekday,
        start_time: { lte: new Date(`1970-01-01T${startTime}:00Z`) },
        end_time: { gte: new Date(`1970-01-01T${endTime}:00Z`) },
        AND: [
          {
            OR: [
              { effective_from: null },
              { effective_from: { lte: startAt } },
            ],
          },
          {
            OR: [
              { effective_to: null },
              { effective_to: { gte: startAt } },
            ],
          },
        ],
      },
    });

    if (availableSlots.length === 0) {
      throw new BadRequestException('Teacher is not available at the requested time');
    }
  }

  private async checkStudentBalance(studentId: string, courseId: string) {
    // 檢查課程包餘額
    const packages = await this.prisma.renamedpackage.findMany({
      where: {
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        remaining_sessions: { gt: 0 },
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
    });

    // 檢查 credit ledger 餘額
    const credits = await this.prisma.credit_ledger.aggregate({
      where: { student_id: studentId },
      _sum: { delta_sessions: true },
    });

    const totalAvailable = (packages.reduce((sum, pkg) => sum + pkg.remaining_sessions, 0)) + 
                          (credits._sum.delta_sessions || 0);

    if (totalAvailable <= 0) {
      throw new BadRequestException('Insufficient session balance');
    }
  }

  private async checkTimeConflict(teacherId: string, startAt: Date, endAt: Date) {
    const conflictingSessions = await this.prisma.session.findMany({
      where: {
        teacher_id: teacherId,
        status: { in: ['pending', 'confirmed'] },
        OR: [
          {
            AND: [
              { start_at: { lte: startAt } },
              { end_at: { gt: startAt } },
            ],
          },
          {
            AND: [
              { start_at: { lt: endAt } },
              { end_at: { gte: endAt } },
            ],
          },
          {
            AND: [
              { start_at: { gte: startAt } },
              { end_at: { lte: endAt } },
            ],
          },
        ],
      },
    });

    if (conflictingSessions.length > 0) {
      throw new BadRequestException('Teacher has conflicting sessions at the requested time');
    }
  }

  private async deductStudentBalance(tx: any, studentId: string, courseId: string, sessionId: string) {
    // 優先使用課程包
    const package_ = await tx.renamedpackage.findFirst({
      where: {
        student_id: studentId,
        course_id: courseId,
        status: 'active',
        remaining_sessions: { gt: 0 },
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
      orderBy: { expires_at: 'asc' },
    });

    if (package_) {
      await tx.renamedpackage.update({
        where: { id: package_.id },
        data: { remaining_sessions: { decrement: 1 } },
      });
    } else {
      // 使用 credit
      await tx.credit_ledger.create({
        data: {
          student_id: studentId,
          source: 'bonus',
          delta_sessions: -1,
          reason: 'Session booked',
          session_id: sessionId,
        },
      });
    }
  }

  private async checkCancelPermission(session: any, userId: string, userRole: string): Promise<boolean> {
    if (userRole === 'admin') return true;
    
    if (userRole === 'teacher') {
      const teacher = await this.prisma.teacher_profile.findUnique({
        where: { user_id: userId },
      });
      return teacher?.id === session.teacher_id;
    }
    
    if (userRole === 'student') {
      const student = await this.prisma.student_profile.findUnique({
        where: { user_id: userId },
      });
      return session.session_attendee.some((attendee: any) => attendee.student_id === student?.id);
    }
    
    return false;
  }

  private async handleRefund(tx: any, studentId: string, session: any, hoursUntilSession: number, technicalIssue?: boolean) {
    let refundSessions = 0;
    let reason = '';

    if (technicalIssue) {
      refundSessions = 2; // 返還 1 堂 + 補償 1 堂
      reason = 'Technical issue cancellation - refund + compensation';
    } else if (hoursUntilSession >= 24) {
      refundSessions = 1; // 返還 1 堂
      reason = 'Cancelled 24+ hours before session';
    } else {
      refundSessions = 0; // 不返還
      reason = 'Cancelled less than 24 hours before session';
    }

    if (refundSessions > 0) {
      await tx.credit_ledger.create({
        data: {
          student_id: studentId,
          source: 'compensation',
          delta_sessions: refundSessions,
          reason: reason,
          session_id: session.id,
        },
      });
    }
  }

  private formatSession(session: any) {
    return {
      id: session.id,
      course_id: session.course_id,
      teacher_id: session.teacher_id,
      start_at: session.start_at.toISOString(),
      end_at: session.end_at.toISOString(),
      status: session.status,
      meeting_url: session.meeting_url,
      meeting_passcode: session.meeting_passcode,
      created_at: session.created_at.toISOString(),
    };
  }
}
