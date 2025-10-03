import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from '../entities/upload.entity';
import { User, UserRole } from '../entities/user.entity';
import { MinioService } from './minio.service';
import { 
  UPLOAD_CONFIG, 
  FileCategory, 
  FileVisibility, 
  FILE_VISIBILITY_MAP 
} from './upload.config';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload)
    private uploadRepository: Repository<Upload>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private minioService: MinioService,
  ) {}

  async uploadFile(
    userId: string,
    file: any,
    category: FileCategory,
    metadata?: Record<string, any>
  ): Promise<Upload> {
    // 驗證文件類型和大小
    this.validateFile(file, category);

    // 檢查用戶權限
    await this.checkUploadPermission(userId, category);

    // 生成唯一文件名
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const visibility = FILE_VISIBILITY_MAP[category];
    const bucketName = visibility === FileVisibility.PUBLIC 
      ? this.minioService.getPublicBucket() 
      : this.minioService.getPrivateBucket();

    // 構建文件路徑
    const filePath = `${category}/${userId}/${fileName}`;

    // 上傳到 MinIO
    await this.minioService.uploadFile(
      bucketName,
      filePath,
      file.buffer,
      {
        'Content-Type': file.mimetype,
        'Original-Name': file.originalname,
      }
    );

    // 生成 URL
    let publicUrl: string | undefined;
    let cdnUrl: string | undefined;

    if (visibility === FileVisibility.PUBLIC) {
      publicUrl = this.minioService.getPublicUrl(filePath);
      // CDN URL 預留擴展
      cdnUrl = this.generateCdnUrl(filePath);
    }

    // 保存到數據庫
    const upload = this.uploadRepository.create({
      userId,
      originalName: file.originalname,
      fileName,
      filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      category,
      visibility,
      minioBucket: bucketName,
      minioKey: filePath,
      publicUrl,
      cdnUrl,
      metadata,
    });

    return await this.uploadRepository.save(upload);
  }

  async getFile(fileId: string, userId: string, userRole: UserRole): Promise<Upload> {
    const upload = await this.uploadRepository.findOne({
      where: { id: fileId },
      relations: ['user'],
    });

    if (!upload) {
      throw new NotFoundException('File not found');
    }

    // 檢查訪問權限
    await this.checkFileAccess(upload, userId, userRole);

    return upload;
  }

  async getFileUrl(fileId: string, userId: string, userRole: UserRole): Promise<string> {
    const upload = await this.getFile(fileId, userId, userRole);

    if (upload.visibility === FileVisibility.PUBLIC && upload.publicUrl) {
      return upload.cdnUrl || upload.publicUrl;
    }

    // 私有文件生成臨時 URL
    return await this.minioService.getFileUrl(upload.minioBucket, upload.minioKey);
  }

  async deleteFile(fileId: string, userId: string, userRole: UserRole): Promise<void> {
    const upload = await this.uploadRepository.findOne({
      where: { id: fileId },
    });

    if (!upload) {
      throw new NotFoundException('File not found');
    }

    // 檢查刪除權限
    if (upload.userId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('No permission to delete this file');
    }

    // 從 MinIO 刪除
    await this.minioService.deleteFile(upload.minioBucket, upload.minioKey);

    // 從數據庫刪除
    await this.uploadRepository.remove(upload);
  }

  async getUserFiles(
    userId: string, 
    category?: FileCategory,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ items: Upload[]; total: number; page: number; pageSize: number }> {
    const queryBuilder = this.uploadRepository.createQueryBuilder('upload')
      .where('upload.userId = :userId', { userId })
      .orderBy('upload.createdAt', 'DESC');

    if (category) {
      queryBuilder.andWhere('upload.category = :category', { category });
    }

    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }

  private validateFile(file: any, category: FileCategory): void {
    const config = UPLOAD_CONFIG[category];
    if (!config) {
      throw new BadRequestException(`Invalid file category: ${category}`);
    }

    // 檢查文件大小
    if (file.size > config.maxSizeBytes) {
      throw new BadRequestException(
        `File size exceeds limit. Maximum allowed: ${config.maxSizeBytes / (1024 * 1024)}MB`
      );
    }

    // 檢查 MIME 類型
    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${config.allowedMimeTypes.join(', ')}`
      );
    }

    // 檢查文件擴展名
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!config.extensions.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed extensions: ${config.extensions.join(', ')}`
      );
    }
  }

  private async checkUploadPermission(userId: string, category: FileCategory): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 根據文件類型檢查權限
    switch (category) {
      case FileCategory.TEACHER_INTRO_VIDEO:
      case FileCategory.TEACHER_AUDIO:
      case FileCategory.TEACHER_GALLERY:
        if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
          throw new ForbiddenException('Only teachers can upload this type of file');
        }
        break;
      case FileCategory.STUDENT_HOMEWORK:
        if (user.role !== UserRole.STUDENT && user.role !== UserRole.ADMIN) {
          throw new ForbiddenException('Only students can upload homework');
        }
        break;
      case FileCategory.TEACHING_MATERIAL:
        if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
          throw new ForbiddenException('Only teachers can upload teaching materials');
        }
        break;
      // AVATAR 和 CLASS_RECORDING 所有角色都可以上傳
    }
  }

  private async checkFileAccess(upload: Upload, userId: string, userRole: UserRole): Promise<void> {
    // 公開文件所有人都可以訪問
    if (upload.visibility === FileVisibility.PUBLIC) {
      return;
    }

    // 私有文件權限檢查
    if (upload.userId === userId || userRole === UserRole.ADMIN) {
      return;
    }

    // 特殊情況：學生作業和課程錄影，授課教師也可以訪問
    if (upload.category === FileCategory.STUDENT_HOMEWORK || 
        upload.category === FileCategory.CLASS_RECORDING) {
      // 這裡需要檢查是否為相關的教師，暫時允許所有教師訪問
      if (userRole === UserRole.TEACHER) {
        return;
      }
    }

    throw new ForbiddenException('No permission to access this file');
  }

  private generateCdnUrl(filePath: string): string {
    // CDN URL 生成邏輯，預留擴展
    // 在 MVP 階段返回 null，未來可以配置 CDN 服務
    return null;
  }
}
