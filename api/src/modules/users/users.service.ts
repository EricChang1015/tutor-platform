import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ListUsersDto } from './dto/list-users.dto';
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(dto: CreateUserDto) {
    const exists = await this.prisma.app_user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email already exists');
    const password_hash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.app_user.create({
        data: {
          email: dto.email,
          phone: dto.phone ?? null,
          password_hash,
          role: dto.role,
          name: dto.name,
          is_active: dto.is_active ?? true,
          timezone: dto.timezone ?? 'UTC',
        },
      });

      if (dto.role === Role.Teacher) {
        await tx.teacher_profile.create({
          data: {
            user_id: user.id,
            display_name: user.name,
          },
        });
      } else if (dto.role === Role.Student) {
        await tx.student_profile.create({
          data: {
            user_id: user.id,
            parent_contact: {},
            preferences: {},
          },
        });
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        timezone: user.timezone,
        is_active: user.is_active,
      };
    });
  }

  async getUserById(id: string) {
    const user = await this.prisma.app_user.findUnique({
      where: { id },
      include: {
        teacher_profile: true,
        student_profile: true
      }
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      timezone: user.timezone,
      is_active: user.is_active,
      teacher_profile: user.teacher_profile,
      student_profile: user.student_profile,
    };
  }

  async listUsers(query: ListUsersDto) {
    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.active === 'true') where.is_active = true;
    if (query.active === 'false') where.is_active = false;
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { name: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    const users = await this.prisma.app_user.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        timezone: true,
        is_active: true,
        created_at: true,
      },
    });
    return users;
  }

  async resetPassword(userId: string, newPassword: string) {
    const user = await this.prisma.app_user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const password_hash = await bcrypt.hash(newPassword, 10);
    await this.prisma.app_user.update({
      where: { id: userId },
      data: { password_hash },
    });
    return { ok: true };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.app_user.findUnique({
      where: { id: userId },
      include: {
        teacher_profile: true,
        student_profile: true
      }
    });
    if (!user) throw new NotFoundException('User not found');

    // 如果要更新 email，檢查是否已存在
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.app_user.findUnique({
        where: { email: dto.email }
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 更新 app_user 表
      const updatedUser = await tx.app_user.update({
        where: { id: userId },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.email && { email: dto.email }),
          ...(dto.phone && { phone: dto.phone }),
          ...(dto.timezone && { timezone: dto.timezone }),
          updated_at: new Date(),
        },
      });

      // 如果是老師，更新 teacher_profile 表
      if (user.role === Role.Teacher && user.teacher_profile) {
        await tx.teacher_profile.update({
          where: { user_id: userId },
          data: {
            ...(dto.display_name && { display_name: dto.display_name }),
            ...(dto.bio && { bio: dto.bio }),
            ...(dto.photo_url && { photo_url: dto.photo_url }),
            ...(dto.intro_video_url && { intro_video_url: dto.intro_video_url }),
            updated_at: new Date(),
          },
        });
      }

      // 返回完整的用戶資料
      const fullUser = await tx.app_user.findUnique({
        where: { id: userId },
        include: {
          teacher_profile: true,
          student_profile: true
        }
      });

      if (!fullUser) throw new NotFoundException('User not found after update');

      return {
        id: fullUser.id,
        email: fullUser.email,
        role: fullUser.role,
        name: fullUser.name,
        phone: fullUser.phone,
        timezone: fullUser.timezone,
        is_active: fullUser.is_active,
        teacher_profile: fullUser.teacher_profile,
        student_profile: fullUser.student_profile,
      };
    });
  }

  async getRecommendedTeachers(limit: number = 4) {
    const teachers = await this.prisma.teacher_profile.findMany({
      include: {
        app_user: {
          select: {
            id: true,
            name: true,
            email: true,
            is_active: true,
          },
        },
        _count: {
          select: {
            session: true, // 課程數量
          },
        },
      },
      where: {
        app_user: {
          is_active: true,
        },
      },
      orderBy: [
        { session: { _count: 'desc' } }, // 按課程數量排序
        { created_at: 'desc' }, // 然後按創建時間排序
      ],
      take: limit,
    });

    return teachers.map(teacher => ({
      id: teacher.id,
      user_id: teacher.app_user.id,
      name: teacher.app_user.name,
      email: teacher.app_user.email,
      display_name: teacher.display_name,
      bio: teacher.bio,
      photo_url: teacher.photo_url,
      intro_video_url: teacher.intro_video_url,
      session_count: teacher._count.session,
      rating: 4.5 + Math.random() * 0.5, // 模擬評分，實際應該從評分表計算
    }));
  }
}