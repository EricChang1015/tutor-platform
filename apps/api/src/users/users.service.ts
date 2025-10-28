import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UploadsService } from '../uploads/uploads.service';
import { FileCategory } from '../uploads/upload.config';
import { LoggerService } from '../common/logger.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new LoggerService('UsersService');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private uploadsService: UploadsService,
  ) {}

  async findById(id: string): Promise<User> {
    this.logger.debug(`Finding user by ID: ${id}`);

    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'role', 'name', 'avatarUrl', 'bio'],
    });

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User found: ${user.name} (${id})`);
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, currentUserId: string, currentUserRole?: string): Promise<User> {
    this.logger.log(`Updating user: ${id} by ${currentUserId}`);

    // 檢查權限：管理員可以更新所有人的資料，其他人只能更新自己的資料
    if (currentUserRole !== UserRole.ADMIN && id !== currentUserId) {
      this.logger.warn(`Forbidden: User ${currentUserId} attempted to update user ${id}`);
      throw new ForbiddenException('Forbidden: Can only update own profile');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.warn(`User not found for update: ${id}`);
      throw new NotFoundException('User not found');
    }

    // 特殊處理 settings：與既有設定合併（淺合併）
    const { settings, ...rest } = updateUserDto as any;
    Object.assign(user, rest);
    if (settings && typeof settings === 'object') {
      user.settings = { ...(user.settings || {}), ...settings };
    }

    await this.userRepository.save(user);
    this.logger.log(`User updated successfully: ${id}`);

    // 返回更新後的公開資料
    return this.findById(id);
  }

  async uploadAvatar(userId: string, file: any): Promise<User> {
    this.logger.log(`Uploading avatar for user: ${userId}`);

    // 上傳頭像文件
    const upload = await this.uploadsService.uploadFile(
      userId,
      file,
      FileCategory.AVATAR
    );

    // 更新用戶的頭像 URL
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`User not found for avatar upload: ${userId}`);
      throw new NotFoundException('User not found');
    }

    user.avatarUrl = upload.publicUrl || upload.cdnUrl;
    await this.userRepository.save(user);

    this.logger.log(`Avatar uploaded successfully for user: ${userId}`);

    return this.findById(userId);
  }

  async getAvatarUrl(userId: string): Promise<string | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['avatarUrl']
    });

    return user?.avatarUrl || null;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    this.logger.log(`Password change request for user: ${userId}`);

    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // 檢查新密碼和確認密碼是否一致
    if (newPassword !== confirmPassword) {
      this.logger.warn(`Password change failed - passwords do not match: ${userId}`);
      throw new BadRequestException('New password and confirm password do not match');
    }

    // 獲取用戶（包含密碼）
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash']
    });

    if (!user) {
      this.logger.warn(`User not found for password change: ${userId}`);
      throw new NotFoundException('User not found');
    }

    // 驗證當前密碼
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      this.logger.warn(`Password change failed - incorrect current password: ${userId}`);
      throw new BadRequestException('Current password is incorrect');
    }

    // 加密新密碼
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 更新密碼
    await this.userRepository.update(userId, { passwordHash: hashedNewPassword });

    this.logger.log(`Password changed successfully for user: ${userId}`);

    return { message: 'Password changed successfully' };
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name', 'phone', 'bio', 'avatarUrl', 'timezone', 'role', 'createdAt']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 如果是教師，獲取教師額外資料
    if (user.role === UserRole.TEACHER) {
      // 這裡需要查詢 teacher_profiles 表
      // 暫時返回基本資料，後續會在 teachers 服務中實現
    }

    return user;
  }
}
