import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [ReportsController],
})
export class ReportsModule {}

