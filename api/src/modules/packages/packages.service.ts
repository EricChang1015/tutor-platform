import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PackagesService {
  private prisma = new PrismaClient();

  async createPackage(params: { studentId: string; courseId: string; totalSessions: number; notes?: string }) {
    const { studentId, courseId, totalSessions, notes } = params;

    const [student, course] = await Promise.all([
      this.prisma.student_profile.findUnique({ where: { id: studentId } }),
      this.prisma.courses.findUnique({ where: { id: courseId } }),
    ]);
    if (!student) throw new NotFoundException('Student profile not found');
    if (!course) throw new NotFoundException('Course not found');
    if (!course.is_active) throw new BadRequestException('Course is inactive');

    const pkg = await this.prisma.renamedpackage.create({
      data: {
        student_profile_id: studentId,
        course_id: courseId,
        total_sessions: totalSessions,
        remaining_sessions: totalSessions,
        notes: notes ?? null,
        status: 'active',
      },
    });
    return pkg;
  }

  async getStudentSummary(studentId: string) {
    const student = await this.prisma.student_profile.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const [packages, creditsAgg] = await Promise.all([
      this.prisma.renamedpackage.findMany({
        where: { student_profile_id: studentId, status: 'active' },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          course_id: true,
          total_sessions: true,
          remaining_sessions: true,
          status: true,
          notes: true,
          created_at: true,
        },
      }),
      this.prisma.credit_ledger.aggregate({
        where: { student_id: studentId },
        _sum: { delta_sessions: true },
      }),
    ]);

    const remainingFromPackages = packages.reduce((sum, p) => sum + (p.remaining_sessions ?? 0), 0);
    const credits = creditsAgg._sum.delta_sessions ?? 0;

    return {
      studentId,
      remainingFromPackages,
      credits,
      totalAvailable: remainingFromPackages + credits,
      packages,
    };
  }

  async adjustSessions(params: { studentId: string; delta: number; reason: string; sessionId?: string | null }) {
    const { studentId, delta, reason, sessionId } = params;
    const student = await this.prisma.student_profile.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const entry = await this.prisma.credit_ledger.create({
      data: {
        student_id: studentId,
        source: 'adjustment',
        delta_sessions: delta,
        reason,
        session_id: sessionId ?? null,
      },
    });
    return entry;
  }
}

