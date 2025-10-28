import { Module, Global } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [
    {
      provide: LoggerService,
      useFactory: () => new LoggerService('Application'),
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}

