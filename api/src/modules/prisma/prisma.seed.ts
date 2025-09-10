import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaSeedService {
  private readonly logger = new Logger(PrismaSeedService.name);
  constructor(private readonly prisma: PrismaService, private readonly cfg: ConfigService) {}

  async seedAdminIfNeeded() {
    const email = this.cfg.get<string>('ADMIN_SEED_EMAIL');
    const password = this.cfg.get<string>('ADMIN_SEED_PASSWORD');

    if (!email || !password) {
      this.logger.log('ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD not set, skip seeding admin');
      return;
    }

    const exists = await this.prisma.app_user.findUnique({ where: { email } });
    if (exists) {
      this.logger.log(`Admin already exists: ${email}`);
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.app_user.create({
      data: {
        email,
        password_hash,
        role: 'admin',
        name: 'Admin',
        is_active: true,
        timezone: 'UTC',
      },
    });

    this.logger.log(`Seeded admin user: ${user.email}`);
  }
}