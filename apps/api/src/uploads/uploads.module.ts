import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { MinioService } from './minio.service';
import { Upload } from '../entities/upload.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Upload, User]),
    ConfigModule,
  ],
  controllers: [UploadsController],
  providers: [UploadsService, MinioService],
  exports: [UploadsService, MinioService],
})
export class UploadsModule {}
