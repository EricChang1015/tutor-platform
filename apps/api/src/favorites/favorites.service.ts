import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getFavorites(userId: string) {
    // 簡化實現：返回模擬資料
    return {
      items: [
        {
          teacherId: '22222222-2222-2222-2222-222222222222',
          addedAt: new Date().toISOString(),
        }
      ]
    };
  }

  async addFavorite(userId: string, teacherId: string) {
    // 簡化實現：檢查教師是否存在
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER }
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // 檢查是否已收藏
    // 在實際應用中，這裡會檢查 favorites 表
    
    return {
      teacherId,
      addedAt: new Date().toISOString(),
    };
  }

  async removeFavorite(userId: string, teacherId: string) {
    // 簡化實現：直接返回成功
    return { success: true };
  }
}
