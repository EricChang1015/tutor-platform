import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { PostClassController } from './post-class.controller';
import { Booking } from '../entities/booking.entity';
import { User } from '../entities/user.entity';
import { Purchase } from '../entities/purchase.entity';
import { Upload } from '../entities/upload.entity';
import { BookingEvidence } from '../entities/booking-evidence.entity';
import { TeacherAvailabilityModule } from '../teacher-availability/teacher-availability.module';
import { PurchasesModule } from '../purchases/purchases.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, User, Purchase, Upload, BookingEvidence]),
    TeacherAvailabilityModule,
    PurchasesModule,
    UploadsModule,
  ],
  controllers: [BookingsController, PostClassController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

