import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type PricingResolution = {
  price_cents: number;
  commission_pct: number;
  sources: {
    price?: { id: string; scope: 'global' | 'teacher' | 'course' };
    commission?: { id: string; scope: 'global' | 'teacher' | 'course' };
  };
};

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * 依據規則解析最終 price_cents 與 commission_pct
   * - 過濾 active=true、priority DESC、時間窗有效(valid_from/valid_to)
   * - 依 scope 對欄位進行覆寫：teacher > course > global
   * - 欄位獨立覆寫（price 與 commission 可能來自不同規則）
   */
  async resolve(params: {
    teacherId?: string | null; // teacher_profile.id
    courseId: string; // course.id
    at?: Date; // 解析時間點，默認 now
  }): Promise<PricingResolution> {
    const { teacherId, courseId } = params;
    const at = params.at ?? new Date();

    // 確認課程存在
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || !course.active) {
      throw new NotFoundException('Course not found or inactive');
    }

    // 取出所有可能規則（global + course + teacher），並於記憶體排序
    const rules = await this.prisma.pricing_rule.findMany({
      where: {
        active: true,
        OR: [
          { scope: 'global' },
          { scope: 'course', course_id: courseId },
          ...(teacherId ? [{ scope: 'teacher', teacher_id: teacherId }] : []),
        ],
        AND: [
          {
            OR: [{ valid_from: null }, { valid_from: { lte: at } }],
          },
          {
            OR: [{ valid_to: null }, { valid_to: { gte: at } }],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }],
    });

    // 預設值（來自 course.default_price_cents 與全域假設 commission 40%）
    // 注意：若需要嚴格依 DB 中的 global rule 作為 baseline，可將此處 commission 預設設為 null，逼迫必須有 global 規則。
    let resolvedPrice = course.default_price_cents ?? 700;
    let resolvedCommission = 40;

    let sourcePrice: PricingResolution['sources']['price'];
    let sourceCommission: PricingResolution['sources']['commission'];

    // 排序後的規則中，依 scope 覆寫。因為 priority 已降序，因此先遇到者優先。
    // 欄位獨立覆寫：price 可能由一條規則提供，commission 可能另一條。
    for (const r of rules) {
      // 確認 scope
      const scope = r.scope as 'global' | 'teacher' | 'course';

      if (r.price_cents != null && sourcePrice == null) {
        resolvedPrice = r.price_cents;
        sourcePrice = { id: r.id, scope };
      }
      if (r.commission_pct != null && sourceCommission == null) {
        resolvedCommission = r.commission_pct;
        sourceCommission = { id: r.id, scope };
      }

      // 如果兩個欄位都已解析，可提前結束
      if (sourcePrice && sourceCommission) break;
    }

    return {
      price_cents: resolvedPrice,
      commission_pct: resolvedCommission,
      sources: {
        price: sourcePrice,
        commission: sourceCommission,
      },
    };
  }
}