import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';
import { TeacherGallery } from '../entities/teacher-gallery.entity';
import { Purchase } from '../entities/purchase.entity';
import { Booking } from '../entities/booking.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { Material } from '../entities/material.entity';
import { Review } from '../entities/review.entity';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      TeacherProfile,
      TeacherGallery,
      Purchase,
      Booking,
      TeacherAvailability,
      Material,
      Review
    ]),
    UploadsModule
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
