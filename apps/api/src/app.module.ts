import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeachersModule } from './teachers/teachers.module';
import { BookingsModule } from './bookings/bookings.module';
import { PurchasesModule } from './purchases/purchases.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    // 環境變數配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 靜態檔案服務
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),

    // 資料庫連接
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false, // 暫時關閉自動同步
      logging: process.env.NODE_ENV === 'development',
    }),

    // 限流保護
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 分鐘
        limit: 100, // 100 次請求
      },
    ]),

    // 功能模組
    AuthModule,
    UsersModule,
    TeachersModule,
    BookingsModule,
    PurchasesModule,
    AdminModule,
  ],
})
export class AppModule {}
