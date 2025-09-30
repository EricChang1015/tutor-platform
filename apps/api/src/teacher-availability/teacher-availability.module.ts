import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeacherAvailabilityController } from './teacher-availability.controller';
import { TeacherAvailabilityService } from './teacher-availability.service';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherAvailability, User])],
  controllers: [TeacherAvailabilityController],
  providers: [TeacherAvailabilityService],
  exports: [TeacherAvailabilityService],
})
export class TeacherAvailabilityModule {}
