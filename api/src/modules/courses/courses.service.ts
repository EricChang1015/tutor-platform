import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(teacherId: string, dto: CreateCourseDto) {
    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type ?? 'one_on_one',
        duration_min: dto.duration_min ?? 25,
        default_price_cents: dto.default_price_cents ?? 700,
        active: dto.active ?? true,
        // TODO: 添加 teacher_id 字段到 schema
      },
    });
    return course;
  }

  async listActive() {
    return this.prisma.course.findMany({ where: { active: true }, orderBy: { created_at: 'desc' } });
  }

  async getById(id: string) {
    const c = await this.prisma.course.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Course not found');
    return c;
  }

  async getByTeacher(teacherId: string) {
    // TODO: 當 schema 有 teacher_id 字段時，根據老師 ID 篩選
    return this.prisma.course.findMany({
      where: {
        active: true
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async getRecommended(limit: number = 6) {
    const courses = await this.prisma.course.findMany({
      where: { active: true },
      include: {
        _count: {
          select: {
            session: true, // 課程被預約的次數
          },
        },
      },
      orderBy: [
        { session: { _count: 'desc' } }, // 按受歡迎程度排序
        { created_at: 'desc' }, // 然後按創建時間排序
      ],
      take: limit,
    });

    return courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      type: course.type,
      duration_min: course.duration_min,
      default_price_cents: course.default_price_cents,
      active: course.active,
      session_count: course._count.session,
      popularity_score: course._count.session * 10 + Math.floor(Math.random() * 50), // 模擬受歡迎程度
    }));
  }
}

