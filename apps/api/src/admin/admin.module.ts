import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';
import { Purchase } from '../entities/purchase.entity';
import { Booking } from '../entities/booking.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { Material } from '../entities/material.entity';
import { BookingMessage } from '../entities/booking-message.entity';
import { PostClassReport } from '../entities/post-class-report.entity';
import { Settlement } from '../entities/settlement.entity';
import { ConsumptionRecord } from '../entities/consumption-record.entity';
import { Review } from '../entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    User,
    TeacherProfile,
    Purchase,
    Booking,
    TeacherAvailability,
    Material,
    BookingMessage,
    PostClassReport,
    Settlement,
    ConsumptionRecord,
    Review
  ])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
