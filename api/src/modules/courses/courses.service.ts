import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type ?? '1on1',
        duration_min: dto.duration_min ?? 25,
        default_price_cents: dto.default_price_cents ?? 700,
        active: dto.active ?? true,
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
}

