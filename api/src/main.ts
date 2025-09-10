import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // 監聽未捕捉錯誤，便於在容器日誌中看到原因
  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('UnhandledRejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    // eslint-disable-next-line no-console
    console.error('UncaughtException:', err);
  });

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService);
  const port = parseInt(config.get('PORT') ?? process.env.PORT ?? '3001', 10);
  const host = '0.0.0.0';

  await app.listen(port, host);

  const url = await app.getUrl();
  logger.log(`API listening on ${url}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Bootstrap failed:', err);
  process.exit(1);
});