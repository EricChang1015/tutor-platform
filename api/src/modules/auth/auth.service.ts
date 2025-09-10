import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

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
}