import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context: string;

  constructor(context: string = 'Application') {
    this.context = context;
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logDir = path.join(process.cwd(), '../../data/logs/api');
    try { fs.mkdirSync(logDir, { recursive: true }); } catch (_) {}

    // 定義日誌格式
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
        const ctx = context || this.context;
        let log = `${timestamp} [${level.toUpperCase()}] [${ctx}] ${message}`;
        
        // 添加額外的元數據
        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }
        
        // 添加堆棧跟踪（如果有錯誤）
        if (stack) {
          log += `\n${stack}`;
        }
        
        return log;
      })
    );

    // 創建日誌傳輸器
    const transports: winston.transport[] = [
      // 控制台輸出
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        ),
      }),
      
      // 所有日誌（info 及以上級別）
      new DailyRotateFile({
        dirname: logDir,
        filename: 'application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: '30d',
        format: logFormat,
        level: 'info',
        zippedArchive: true, // 壓縮舊日誌
      }),
      
      // 錯誤日誌
      new DailyRotateFile({
        dirname: logDir,
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '50m',
        maxFiles: '30d',
        format: logFormat,
        level: 'error',
        zippedArchive: true,
      }),
      
      // 調試日誌（僅在開發環境）
      ...(process.env.NODE_ENV === 'development' ? [
        new DailyRotateFile({
          dirname: logDir,
          filename: 'debug-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '50m',
          maxFiles: '7d',
          format: logFormat,
          level: 'debug',
          zippedArchive: true,
        })
      ] : []),
    ];

    return winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      transports,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { 
      context: context || this.context,
      stack: trace 
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }

  // 額外的輔助方法
  logMethodCall(methodName: string, params?: any) {
    this.logger.info(`Method called: ${methodName}`, {
      context: this.context,
      method: methodName,
      params: params ? JSON.stringify(params) : undefined,
    });
  }

  logMethodResult(methodName: string, result?: any) {
    this.logger.info(`Method completed: ${methodName}`, {
      context: this.context,
      method: methodName,
      result: result ? JSON.stringify(result) : undefined,
    });
  }

  logError(methodName: string, error: Error) {
    this.logger.error(`Method failed: ${methodName}`, {
      context: this.context,
      method: methodName,
      error: error.message,
      stack: error.stack,
    });
  }

  logRequest(method: string, url: string, userId?: string) {
    this.logger.info(`HTTP Request: ${method} ${url}`, {
      context: this.context,
      method,
      url,
      userId,
    });
  }

  logResponse(method: string, url: string, statusCode: number, duration?: number) {
    this.logger.info(`HTTP Response: ${method} ${url} - ${statusCode}`, {
      context: this.context,
      method,
      url,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    });
  }
}

