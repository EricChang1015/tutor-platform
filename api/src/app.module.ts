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
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingModule } from './modules/booking/booking.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PayoutsModule } from './modules/payouts/payouts.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), PrismaModule, UsersModule, AuthModule, PricingModule, PackagesModule, CoursesModule, AvailabilityModule, BookingModule, SessionsModule, StorageModule, NotificationsModule, PayoutsModule],
  controllers: [HealthController, AppController],
  providers: [AppService],
})
export class AppModule {}