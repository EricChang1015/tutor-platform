import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeetingDto } from './dto/update-meeting.dto';
import { SubmitTeacherReportDto } from './dto/submit-teacher-report.dto';
import { SubmitStudentGoalDto } from './dto/submit-student-goal.dto';
import { UploadProofDto } from './dto/upload-proof.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async getSessionDetails(sessionId: string, userId: string, userRole: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        teacher_profile: {
          include: {
            app_user: {
              select: { name: true, email: true },
            },
          },
        },
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
        session_report: true,
        session_proof: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // 檢查權限
    const hasAccess = await this.checkSessionAccess(session, userId, userRole);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this session');
    }

    return this.formatSessionDetails(session);
  }

  async updateMeetingInfo(sessionId: string, teacherId: string, dto: UpdateMeetingDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.teacher_id !== teacherId) {
      throw new ForbiddenException('You can only update your own sessions');
    }

    if (session.status === 'cancelled' || session.status === 'completed') {
      throw new BadRequestException('Cannot update meeting info for cancelled or completed sessions');
    }

    const updatedSession = await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        meeting_url: dto.meeting_url,
        meeting_passcode: dto.meeting_passcode,
      },
    });

    return this.formatSession(updatedSession);
  }

  async submitTeacherReport(sessionId: string, teacherId: string, dto: SubmitTeacherReportDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.teacher_id !== teacherId) {
      throw new ForbiddenException('You can only submit reports for your own sessions');
    }

    if (session.status !== 'confirmed') {
      throw new BadRequestException('Can only submit reports for confirmed sessions');
    }

    // 檢查課程是否已經開始
    if (new Date() < session.start_at) {
      throw new BadRequestException('Cannot submit report before session starts');
    }

    const report = await this.prisma.session_report.upsert({
      where: { session_id: sessionId },
      update: {
        teacher_notes: dto.teacher_notes,
        teacher_submitted_at: new Date(),
      },
      create: {
        session_id: sessionId,
        teacher_notes: dto.teacher_notes,
        teacher_submitted_at: new Date(),
      },
    });

    // 檢查是否可以標記為完成
    await this.checkAndMarkCompleted(sessionId);

    return { ok: true, report_id: report.id };
  }

  async submitStudentGoal(sessionId: string, studentId: string, dto: SubmitStudentGoalDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        session_attendee: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const attendee = session.session_attendee.find(a => a.student_id === studentId);
    if (!attendee) {
      throw new ForbiddenException('You are not enrolled in this session');
    }

    if (session.status !== 'confirmed') {
      throw new BadRequestException('Can only submit goals for confirmed sessions');
    }

    // 檢查課程是否已經開始
    if (new Date() < session.start_at) {
      throw new BadRequestException('Cannot submit goal before session starts');
    }

    const report = await this.prisma.session_report.upsert({
      where: { session_id: sessionId },
      update: {
        student_goal: dto.student_goal,
        student_submitted_at: new Date(),
      },
      create: {
        session_id: sessionId,
        student_goal: dto.student_goal,
        student_submitted_at: new Date(),
      },
    });

    // 檢查是否可以標記為完成
    await this.checkAndMarkCompleted(sessionId);

    return { ok: true, report_id: report.id };
  }

  async uploadProof(sessionId: string, teacherId: string, dto: UploadProofDto) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.teacher_id !== teacherId) {
      throw new ForbiddenException('You can only upload proof for your own sessions');
    }

    if (session.status !== 'confirmed') {
      throw new BadRequestException('Can only upload proof for confirmed sessions');
    }

    // 檢查課程是否已經開始
    if (new Date() < session.start_at) {
      throw new BadRequestException('Cannot upload proof before session starts');
    }

    const proof = await this.prisma.session_proof.create({
      data: {
        session_id: sessionId,
        teacher_id: teacherId,
        type: dto.type,
        url: dto.url,
        meta: dto.meta || {},
      },
    });

    // 檢查是否可以標記為完成
    await this.checkAndMarkCompleted(sessionId);

    return { ok: true, proof_id: proof.id };
  }

  async getSessionProofs(sessionId: string, userId: string, userRole: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        session_proof: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // 檢查權限
    const hasAccess = await this.checkSessionAccess(session, userId, userRole);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this session');
    }

    return session.session_proof.map(proof => ({
      id: proof.id,
      type: proof.type,
      url: proof.url,
      meta: proof.meta,
      created_at: proof.created_at.toISOString(),
    }));
  }

  private async checkSessionAccess(session: any, userId: string, userRole: string): Promise<boolean> {
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
      return session.session_attendee?.some((attendee: any) => attendee.student_id === student?.id);
    }
    
    return false;
  }

  private async checkAndMarkCompleted(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        session_report: true,
        session_proof: true,
      },
    });

    if (!session) return;

    // 檢查是否滿足完成條件：有老師回報、學生目標、和證明
    const hasTeacherReport = session.session_report?.teacher_notes && session.session_report?.teacher_submitted_at;
    const hasStudentGoal = session.session_report?.student_goal && session.session_report?.student_submitted_at;
    const hasProof = session.session_proof.length > 0;

    if (hasTeacherReport && hasStudentGoal && hasProof && session.status === 'confirmed') {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'completed' },
      });
    }
  }

  private formatSessionDetails(session: any) {
    return {
      id: session.id,
      course: {
        id: session.course.id,
        title: session.course.title,
        description: session.course.description,
        duration_min: session.course.duration_min,
      },
      teacher: {
        id: session.teacher_profile.id,
        name: session.teacher_profile.app_user.name,
        email: session.teacher_profile.app_user.email,
      },
      students: session.session_attendee.map((attendee: any) => ({
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
      report: session.session_report ? {
        teacher_notes: session.session_report.teacher_notes,
        student_goal: session.session_report.student_goal,
        teacher_submitted_at: session.session_report.teacher_submitted_at?.toISOString(),
        student_submitted_at: session.session_report.student_submitted_at?.toISOString(),
      } : null,
      proofs: session.session_proof.map((proof: any) => ({
        id: proof.id,
        type: proof.type,
        url: proof.url,
        meta: proof.meta,
        created_at: proof.created_at.toISOString(),
      })),
      created_at: session.created_at.toISOString(),
    };
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
