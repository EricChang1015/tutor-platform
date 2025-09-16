import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  // 可選：如果你要在應用停止時關閉 Prisma
  async onModuleDestroy() {
    await this.$disconnect();
  }
}