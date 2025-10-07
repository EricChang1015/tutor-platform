import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from '../entities/booking.entity';
import { User } from '../entities/user.entity';
import { Purchase } from '../entities/purchase.entity';
import { TeacherAvailabilityModule } from '../teacher-availability/teacher-availability.module';
import { PurchasesModule } from '../purchases/purchases.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, Purchase]),
    TeacherAvailabilityModule,
    PurchasesModule
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
