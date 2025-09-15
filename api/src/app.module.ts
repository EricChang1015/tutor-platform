import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { HealthController } from './health.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PricingModule } from './modules/pricing/pricing.module';
import { PackagesModule } from './modules/packages/packages.module';
import { CoursesModule } from './modules/courses/courses.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, UsersModule, AuthModule, PricingModule, PackagesModule, CoursesModule],
  controllers: [HealthController, AppController],
  providers: [AppService],
})
export class AppModule {}