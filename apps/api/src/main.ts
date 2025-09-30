import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 啟用 CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 全域驗證管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger 文檔設定
  const config = new DocumentBuilder()
    .setTitle('家教平台 API')
    .setDescription('家教平台後端 API 文檔')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // 靜態檔案服務 - 提供 testAPI.html
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 API 服務已啟動於 http://localhost:${port}`);
  console.log(`📚 API 文檔: http://localhost:${port}/api-docs`);
  console.log(`🧪 測試工具: http://localhost:${port}/testAPI.html`);
}

bootstrap();
