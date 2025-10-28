import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Favorite } from '../entities/favorite.entity';
import { LoggerService } from '../common/logger.service';

@Injectable()
export class FavoritesService {
  private readonly logger = new LoggerService('FavoritesService');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) {}

  async getFavorites(userId: string) {
    this.logger.logMethodCall('getFavorites', { userId });
    const favorites = await this.favoriteRepository.find({
      where: { userId },
      relations: ['teacher', 'teacher.teacherProfile'],
      order: { addedAt: 'DESC' },
    });

    const result = {
      items: favorites.map(favorite => ({
        teacherId: favorite.teacherId,
        addedAt: favorite.addedAt.toISOString(),
        teacher: {
          id: favorite.teacher.id,
          name: favorite.teacher.name,
          avatarUrl: favorite.teacher.avatarUrl,
          bio: favorite.teacher.bio,
          profile: favorite.teacher.teacherProfile ? {
            rating: favorite.teacher.teacherProfile.rating,
            ratingsCount: favorite.teacher.teacherProfile.ratingsCount,
            unitPriceUSD: favorite.teacher.teacherProfile.unitPriceUsd,
            domains: favorite.teacher.teacherProfile.domains,
            regions: favorite.teacher.teacherProfile.regions,
          } : null,
        },
      })),
    };
    this.logger.logMethodResult('getFavorites', { count: favorites.length });
    return result;
  }

  async addFavorite(userId: string, teacherId: string) {
    this.logger.logMethodCall('addFavorite', { userId, teacherId });
    // 檢查教師是否存在且為活躍狀態
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER, active: true }
    });

    if (!teacher) {
      this.logger.warn(`Teacher not found or inactive: ${teacherId}`);
      throw new NotFoundException('Teacher not found or inactive');
    }

    // 檢查是否已收藏
    const existingFavorite = await this.favoriteRepository.findOne({
      where: { userId, teacherId }
    });

    if (existingFavorite) {
      this.logger.warn(`Teacher already in favorites: user=${userId}, teacher=${teacherId}`);
      throw new ConflictException('Teacher already in favorites');
    }

    // 建立收藏記錄
    const favorite = this.favoriteRepository.create({
      userId,
      teacherId,
    });

    const savedFavorite = await this.favoriteRepository.save(favorite);
    this.logger.logMethodResult('addFavorite', { teacherId: savedFavorite.teacherId, addedAt: savedFavorite.addedAt?.toISOString?.() });

    return {
      teacherId: savedFavorite.teacherId,
      addedAt: savedFavorite.addedAt.toISOString(),
    };
  }

  async removeFavorite(userId: string, teacherId: string) {
    this.logger.logMethodCall('removeFavorite', { userId, teacherId });
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, teacherId }
    });

    if (!favorite) {
      this.logger.warn(`Favorite not found: user=${userId}, teacher=${teacherId}`);
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
    this.logger.logMethodResult('removeFavorite', { userId, teacherId, success: true });
    return { success: true };
  }
}
