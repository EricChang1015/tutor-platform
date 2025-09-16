import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { GetUploadUrlDto, FileType } from './dto/get-upload-url.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('S3_ENDPOINT') || 'localhost:9000';
    const accessKey = this.configService.get<string>('S3_ACCESS_KEY') || 'minioadmin';
    const secretKey = this.configService.get<string>('S3_SECRET_KEY') || 'minioadmin';
    const useSSL = this.configService.get<string>('S3_USE_SSL') === 'true';

    this.bucketName = this.configService.get<string>('S3_BUCKET') || 'proofs';

    // Parse endpoint properly - remove http:// or https:// if present
    let cleanEndpoint = endpoint.replace(/^https?:\/\//, '');
    const endpointParts = cleanEndpoint.split(':');
    const endPoint = endpointParts[0];
    const port = endpointParts[1] ? parseInt(endpointParts[1]) : (useSSL ? 443 : 80);

    this.minioClient = new Minio.Client({
      endPoint: endPoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });
  }

  async getUploadUrl(userId: string, userRole: string, dto: GetUploadUrlDto) {
    // 驗證文件類型和大小
    this.validateFile(dto);

    // 生成唯一的文件名
    const fileExtension = this.getFileExtension(dto.filename);
    const uniqueFilename = `${userRole}/${userId}/${uuidv4()}${fileExtension}`;

    try {
      // 生成預簽名上傳 URL（有效期 15 分鐘）
      const uploadUrl = await this.minioClient.presignedPutObject(
        this.bucketName,
        uniqueFilename,
        15 * 60 // 15 minutes
      );

      // 生成下載 URL（用於後續訪問）
      const downloadUrl = await this.minioClient.presignedGetObject(
        this.bucketName,
        uniqueFilename,
        24 * 60 * 60 // 24 hours
      );

      return {
        upload_url: uploadUrl,
        download_url: downloadUrl,
        file_key: uniqueFilename,
        expires_in: 15 * 60, // seconds
      };
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  async getDownloadUrl(fileKey: string, userId: string, userRole: string) {
    // 檢查用戶是否有權限訪問該文件
    if (!this.hasFileAccess(fileKey, userId, userRole)) {
      throw new BadRequestException('You do not have permission to access this file');
    }

    try {
      const downloadUrl = await this.minioClient.presignedGetObject(
        this.bucketName,
        fileKey,
        24 * 60 * 60 // 24 hours
      );

      return {
        download_url: downloadUrl,
        expires_in: 24 * 60 * 60, // seconds
      };
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new InternalServerErrorException('Failed to generate download URL');
    }
  }

  async deleteFile(fileKey: string, userId: string, userRole: string) {
    // 檢查用戶是否有權限刪除該文件
    if (!this.hasFileAccess(fileKey, userId, userRole)) {
      throw new BadRequestException('You do not have permission to delete this file');
    }

    try {
      await this.minioClient.removeObject(this.bucketName, fileKey);
      return { ok: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new InternalServerErrorException('Failed to delete file');
    }
  }

  async listUserFiles(userId: string, userRole: string) {
    const prefix = `${userRole}/${userId}/`;

    try {
      const objectsStream = this.minioClient.listObjects(this.bucketName, prefix, true);
      const files: any[] = [];

      return new Promise((resolve, reject) => {
        objectsStream.on('data', (obj) => {
          files.push({
            key: obj.name,
            size: obj.size,
            last_modified: obj.lastModified,
            etag: obj.etag,
          });
        });

        objectsStream.on('error', (err) => {
          console.error('Error listing files:', err);
          reject(new InternalServerErrorException('Failed to list files'));
        });

        objectsStream.on('end', () => {
          resolve(files);
        });
      });
    } catch (error) {
      console.error('Error listing files:', error);
      throw new InternalServerErrorException('Failed to list files');
    }
  }

  private validateFile(dto: GetUploadUrlDto) {
    // 檢查文件擴展名
    const allowedExtensions = this.getAllowedExtensions(dto.file_type);
    const fileExtension = this.getFileExtension(dto.filename).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed extensions for ${dto.file_type}: ${allowedExtensions.join(', ')}`
      );
    }

    // 檢查 MIME 類型
    const allowedMimeTypes = this.getAllowedMimeTypes(dto.file_type);
    if (!allowedMimeTypes.includes(dto.content_type)) {
      throw new BadRequestException(
        `Invalid content type. Allowed types for ${dto.file_type}: ${allowedMimeTypes.join(', ')}`
      );
    }

    // 檢查文件大小
    if (dto.file_size) {
      const maxSize = this.getMaxFileSize(dto.file_type);
      if (dto.file_size > maxSize) {
        throw new BadRequestException(
          `File size too large. Maximum size for ${dto.file_type}: ${maxSize / (1024 * 1024)}MB`
        );
      }
    }
  }

  private getAllowedExtensions(fileType: FileType): string[] {
    switch (fileType) {
      case FileType.IMAGE:
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      case FileType.VIDEO:
        return ['.mp4', '.avi', '.mov', '.wmv', '.flv'];
      case FileType.DOCUMENT:
        return ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
      case FileType.AUDIO:
        return ['.mp3', '.wav', '.aac', '.ogg', '.m4a'];
      default:
        return [];
    }
  }

  private getAllowedMimeTypes(fileType: FileType): string[] {
    switch (fileType) {
      case FileType.IMAGE:
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      case FileType.VIDEO:
        return ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv'];
      case FileType.DOCUMENT:
        return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf'];
      case FileType.AUDIO:
        return ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/mp4'];
      default:
        return [];
    }
  }

  private getMaxFileSize(fileType: FileType): number {
    switch (fileType) {
      case FileType.IMAGE:
        return 10 * 1024 * 1024; // 10MB
      case FileType.VIDEO:
        return 100 * 1024 * 1024; // 100MB
      case FileType.DOCUMENT:
        return 20 * 1024 * 1024; // 20MB
      case FileType.AUDIO:
        return 50 * 1024 * 1024; // 50MB
      default:
        return 10 * 1024 * 1024; // 10MB default
    }
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  private hasFileAccess(fileKey: string, userId: string, userRole: string): boolean {
    // Admin 可以訪問所有文件
    if (userRole === 'admin') {
      return true;
    }

    // 用戶只能訪問自己的文件
    const expectedPrefix = `${userRole}/${userId}/`;
    return fileKey.startsWith(expectedPrefix);
  }
}
