import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeachersController } from './teachers.controller';
import { TeachersService } from './teachers.service';
import { User } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, TeacherProfile])],
  controllers: [TeachersController],
  providers: [TeachersService],
  exports: [TeachersService],
})
export class TeachersModule {}
