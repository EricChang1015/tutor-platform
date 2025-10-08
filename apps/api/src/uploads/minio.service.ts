import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private readonly publicBucket: string;
  private readonly privateBucket: string;

  constructor(private configService: ConfigService) {
    this.publicBucket = this.configService.get<string>('MINIO_BUCKET_PUBLIC', 'public');
    this.privateBucket = this.configService.get<string>('MINIO_BUCKET_PRIVATE', 'private');
    
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
      port: parseInt(this.configService.get<string>('MINIO_PORT', '9000')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY', 'tutor'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY', 'tutor123'),
    });
  }

  async onModuleInit() {
    await this.ensureBucketsExist();
  }

  private async ensureBucketsExist() {
    try {
      // 檢查並創建 public bucket
      const publicExists = await this.minioClient.bucketExists(this.publicBucket);
      if (!publicExists) {
        await this.minioClient.makeBucket(this.publicBucket);
        // 設置 public bucket 的讀取政策
        const publicPolicy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.publicBucket}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(this.publicBucket, JSON.stringify(publicPolicy));
        this.logger.log(`Created public bucket: ${this.publicBucket}`);
      }

      // 檢查並創建 private bucket
      const privateExists = await this.minioClient.bucketExists(this.privateBucket);
      if (!privateExists) {
        await this.minioClient.makeBucket(this.privateBucket);
        this.logger.log(`Created private bucket: ${this.privateBucket}`);
      }
    } catch (error) {
      this.logger.error('Failed to ensure buckets exist:', error);
    }
  }

  async uploadFile(
    bucketName: string,
    objectName: string,
    buffer: Buffer,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      await this.minioClient.putObject(bucketName, objectName, buffer, buffer.length, metadata);
      return objectName;
    } catch (error) {
      this.logger.error(`Failed to upload file ${objectName}:`, error);
      throw error;
    }
  }

  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(bucketName, objectName);
    } catch (error) {
      this.logger.error(`Failed to delete file ${objectName}:`, error);
      throw error;
    }
  }

  async getFileUrl(bucketName: string, objectName: string, expiry: number = 7 * 24 * 60 * 60): Promise<string> {
    try {
      return await this.minioClient.presignedGetObject(bucketName, objectName, expiry);
    } catch (error) {
      this.logger.error(`Failed to get file URL for ${objectName}:`, error);
      throw error;
    }
  }

  getPublicUrl(objectName: string): string {
    // 對於公開URL，使用外部可訪問的端點
    const endpoint = this.configService.get<string>('MINIO_PUBLIC_ENDPOINT') ||
                     this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<string>('MINIO_PORT', '9000');
    const useSSL = this.configService.get<string>('MINIO_USE_SSL', 'false') === 'true';
    const protocol = useSSL ? 'https' : 'http';

    return `${protocol}://${endpoint}:${port}/${this.publicBucket}/${objectName}`;
  }

  getPublicBucket(): string {
    return this.publicBucket;
  }

  getPrivateBucket(): string {
    return this.privateBucket;
  }
}
