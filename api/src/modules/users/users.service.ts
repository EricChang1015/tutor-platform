import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '../../common/roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
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
    const user = await this.prisma.app_user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      timezone: user.timezone,
      is_active: user.is_active,
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
}