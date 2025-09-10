import { Global, Module, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaSeedService } from './prisma.seed';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, PrismaSeedService],
  exports: [PrismaService, PrismaSeedService],
})
export class PrismaModule implements OnApplicationBootstrap {
  constructor(private readonly seed: PrismaSeedService) {}

  async onApplicationBootstrap() {
    await this.seed.seedAdminIfNeeded();
  }
}