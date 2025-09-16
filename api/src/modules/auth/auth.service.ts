import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.app_user.findUnique({
      where: { email },
    });
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
    });
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        timezone: user.timezone,
      },
    };
  }

  async register(dto: RegisterDto) {
    // 檢查 email 是否已存在
    const existingUser = await this.prisma.app_user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // 加密密碼
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(dto.password, saltRounds);

    // 創建用戶
    const user = await this.prisma.app_user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password_hash,
        role: dto.role,
        is_active: true,
        timezone: 'UTC',
      },
    });

    // 生成 JWT token
    const payload = {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    };
    const access_token = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
    });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        timezone: user.timezone,
      },
    };
  }
}