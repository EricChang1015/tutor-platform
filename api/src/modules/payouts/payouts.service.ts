import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeneratePayoutDto } from './dto/generate-payout.dto';
import { UpdatePayoutDto, PayoutStatus } from './dto/update-payout.dto';

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async generatePayout(dto: GeneratePayoutDto) {
    // 驗證老師存在
    const teacher = await this.prisma.teacher_profile.findUnique({
      where: { id: dto.teacher_id },
      include: {
        app_user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // 驗證日期範圍
    const periodStart = new Date(dto.period_start);
    const periodEnd = new Date(dto.period_end);

    if (periodStart >= periodEnd) {
      throw new BadRequestException('Period start must be before period end');
    }

    // 使用月份作為 period_month（取期間的第一天）
    const periodMonth = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);

    // 檢查是否已經有相同期間的 payout
    const existingPayout = await this.prisma.payout.findFirst({
      where: {
        teacher_id: dto.teacher_id,
        period_month: periodMonth,
      },
    });

    if (existingPayout) {
      throw new BadRequestException('Payout for this period already exists');
    }

    // 計算該期間的完成課程
    const completedSessions = await this.prisma.session.findMany({
      where: {
        teacher_id: dto.teacher_id,
        status: 'completed',
        start_at: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        course: {
          select: { title: true },
        },
      },
    });

    if (completedSessions.length === 0) {
      throw new BadRequestException('No completed sessions found for this period');
    }

    // 計算總金額（這裡使用簡單的計算，實際應該根據課程定價）
    const totalCents = completedSessions.length * 50000; // 假設每堂課 500 元 = 50000 分
    const sessionCount = completedSessions.length;

    // 準備 breakdown 數據
    const breakdown = completedSessions.map(session => ({
      session_id: session.id,
      course_title: session.course.title,
      start_at: session.start_at.toISOString(),
      end_at: session.end_at.toISOString(),
      amount_cents: 50000, // 500 元 = 50000 分
    }));

    // 創建 payout 記錄
    const payout = await this.prisma.payout.create({
      data: {
        teacher_id: dto.teacher_id,
        period_month: periodMonth,
        total_cents: totalCents,
        currency: 'TWD',
        status: 'draft',
        breakdown: breakdown,
      },
    });

    return {
      id: payout.id,
      teacher: {
        id: teacher.id,
        name: teacher.app_user.name,
        email: teacher.app_user.email,
      },
      period_start: dto.period_start,
      period_end: dto.period_end,
      period_month: payout.period_month.toISOString().split('T')[0],
      total_amount: totalCents / 100, // 轉換為元
      total_cents: totalCents,
      session_count: sessionCount,
      currency: payout.currency,
      status: payout.status,
      sessions: completedSessions.map(session => ({
        id: session.id,
        course_title: session.course.title,
        start_at: session.start_at.toISOString(),
        end_at: session.end_at.toISOString(),
      })),
      generated_at: payout.generated_at.toISOString(),
    };
  }

  async getTeacherPayouts(teacherId: string) {
    const teacher = await this.prisma.teacher_profile.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const payouts = await this.prisma.payout.findMany({
      where: { teacher_id: teacherId },
      orderBy: { generated_at: 'desc' },
    });

    return payouts.map(payout => ({
      id: payout.id,
      period_month: payout.period_month.toISOString().split('T')[0],
      total_amount: payout.total_cents / 100, // 轉換為元
      total_cents: payout.total_cents,
      currency: payout.currency,
      status: payout.status,
      breakdown: payout.breakdown,
      generated_at: payout.generated_at.toISOString(),
      updated_at: payout.updated_at.toISOString(),
    }));
  }

  async getAllPayouts() {
    const payouts = await this.prisma.payout.findMany({
      include: {
        teacher_profile: {
          include: {
            app_user: {
              select: { name: true, email: true },
            },
          },
        },
      },
      orderBy: { generated_at: 'desc' },
    });

    return payouts.map(payout => ({
      id: payout.id,
      teacher: {
        id: payout.teacher_profile.id,
        name: payout.teacher_profile.app_user.name,
        email: payout.teacher_profile.app_user.email,
      },
      period_month: payout.period_month.toISOString().split('T')[0],
      total_amount: payout.total_cents / 100, // 轉換為元
      total_cents: payout.total_cents,
      currency: payout.currency,
      status: payout.status,
      breakdown: payout.breakdown,
      generated_at: payout.generated_at.toISOString(),
      updated_at: payout.updated_at.toISOString(),
    }));
  }

  async updatePayout(payoutId: string, dto: UpdatePayoutDto) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    const updatedPayout = await this.prisma.payout.update({
      where: { id: payoutId },
      data: updateData,
      include: {
        teacher_profile: {
          include: {
            app_user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return {
      id: updatedPayout.id,
      teacher: {
        id: updatedPayout.teacher_profile.id,
        name: updatedPayout.teacher_profile.app_user.name,
        email: updatedPayout.teacher_profile.app_user.email,
      },
      period_month: updatedPayout.period_month.toISOString().split('T')[0],
      total_amount: updatedPayout.total_cents / 100, // 轉換為元
      total_cents: updatedPayout.total_cents,
      currency: updatedPayout.currency,
      status: updatedPayout.status,
      breakdown: updatedPayout.breakdown,
      generated_at: updatedPayout.generated_at.toISOString(),
      updated_at: updatedPayout.updated_at.toISOString(),
    };
  }

  async getPayoutDetails(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        teacher_profile: {
          include: {
            app_user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return {
      id: payout.id,
      teacher: {
        id: payout.teacher_profile.id,
        name: payout.teacher_profile.app_user.name,
        email: payout.teacher_profile.app_user.email,
      },
      period_month: payout.period_month.toISOString().split('T')[0],
      total_amount: payout.total_cents / 100, // 轉換為元
      total_cents: payout.total_cents,
      currency: payout.currency,
      status: payout.status,
      breakdown: payout.breakdown,
      generated_at: payout.generated_at.toISOString(),
      updated_at: payout.updated_at.toISOString(),
    };
  }

  async generateMonthlyPayouts(year: number, month: number) {
    // 計算月份的開始和結束日期
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);

    // 獲取所有有完成課程的老師
    const teachersWithSessions = await this.prisma.session.findMany({
      where: {
        status: 'completed',
        start_at: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      select: {
        teacher_id: true,
      },
      distinct: ['teacher_id'],
    });

    const results: Array<{
      teacher_id: string;
      status: string;
      payout_id?: string;
      error?: string;
    }> = [];

    for (const { teacher_id } of teachersWithSessions) {
      try {
        // 檢查是否已經有該月的 payout
        const existingPayout = await this.prisma.payout.findFirst({
          where: {
            teacher_id: teacher_id,
            period_month: periodStart,
          },
        });

        if (!existingPayout) {
          const payout = await this.generatePayout({
            teacher_id: teacher_id,
            period_start: periodStart.toISOString().split('T')[0],
            period_end: periodEnd.toISOString().split('T')[0],
            notes: `Monthly payout for ${year}-${month.toString().padStart(2, '0')}`,
          });

          results.push({
            teacher_id: teacher_id,
            status: 'created',
            payout_id: payout.id,
          });
        } else {
          results.push({
            teacher_id: teacher_id,
            status: 'already_exists',
            payout_id: existingPayout.id,
          });
        }
      } catch (error) {
        results.push({
          teacher_id: teacher_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      total_teachers: teachersWithSessions.length,
      results: results,
    };
  }
}
