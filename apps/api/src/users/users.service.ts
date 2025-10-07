import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadsService } from '../uploads/uploads.service';
import { FileCategory } from '../uploads/upload.config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private uploadsService: UploadsService,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'role', 'name', 'avatarUrl', 'bio'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, currentUserId: string, currentUserRole?: string): Promise<User> {
    // 檢查權限：管理員可以更新所有人的資料，其他人只能更新自己的資料
    if (currentUserRole !== UserRole.ADMIN && id !== currentUserId) {
      throw new ForbiddenException('Forbidden: Can only update own profile');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 更新用戶資料
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // 返回更新後的公開資料
    return this.findById(id);
  }

  async uploadAvatar(userId: string, file: any): Promise<User> {
    // 上傳頭像文件
    const upload = await this.uploadsService.uploadFile(
      userId,
      file,
      FileCategory.AVATAR
    );

    // 更新用戶的頭像 URL
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.avatarUrl = upload.publicUrl || upload.cdnUrl;
    await this.userRepository.save(user);

    return this.findById(userId);
  }

  async getAvatarUrl(userId: string): Promise<string | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['avatarUrl']
    });

    return user?.avatarUrl || null;
  }
}
