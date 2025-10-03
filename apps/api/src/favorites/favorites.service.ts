import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Favorite } from '../entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
  ) {}

  async getFavorites(userId: string) {
    const favorites = await this.favoriteRepository.find({
      where: { userId },
      relations: ['teacher', 'teacher.teacherProfile'],
      order: { addedAt: 'DESC' },
    });

    return {
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
  }

  async addFavorite(userId: string, teacherId: string) {
    // 檢查教師是否存在且為活躍狀態
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER, active: true }
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found or inactive');
    }

    // 檢查是否已收藏
    const existingFavorite = await this.favoriteRepository.findOne({
      where: { userId, teacherId }
    });

    if (existingFavorite) {
      throw new ConflictException('Teacher already in favorites');
    }

    // 建立收藏記錄
    const favorite = this.favoriteRepository.create({
      userId,
      teacherId,
    });

    const savedFavorite = await this.favoriteRepository.save(favorite);

    return {
      teacherId: savedFavorite.teacherId,
      addedAt: savedFavorite.addedAt.toISOString(),
    };
  }

  async removeFavorite(userId: string, teacherId: string) {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, teacherId }
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
    return { success: true };
  }
}
