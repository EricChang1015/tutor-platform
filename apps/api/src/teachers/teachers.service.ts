import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TeacherProfile)
    private teacherProfileRepository: Repository<TeacherProfile>,
  ) {}

  async findAll(query: any = {}) {
    const { page = 1, pageSize = 20, domain, region, q, sort } = query;
    
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.teacherProfile', 'profile')
      .where('user.role = :role', { role: UserRole.TEACHER })
      .andWhere('user.active = :active', { active: true });

    if (domain) {
      queryBuilder.andWhere('profile.domains @> :domain', {
        domain: JSON.stringify([domain])
      });
    }

    if (region) {
      queryBuilder.andWhere('profile.regions @> :region', {
        region: JSON.stringify([region])
      });
    }

    if (q) {
      queryBuilder.andWhere(
        '(user.name LIKE :search OR profile.intro LIKE :search)',
        { search: `%${q}%` }
      );
    }

    // 排序
    if (sort) {
      const [field, order] = sort.split(':');
      if (field && order) {
        queryBuilder.orderBy(`profile.${field}`, order.toUpperCase() as 'ASC' | 'DESC');
      } else {
        queryBuilder.orderBy('profile.rating', 'DESC');
      }
    } else {
      queryBuilder.orderBy('profile.rating', 'DESC');
    }

    // 分頁
    const offset = (page - 1) * pageSize;
    queryBuilder.skip(offset).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map(user => this.formatTeacherCard(user)),
      page,
      pageSize,
      total,
    };
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, role: UserRole.TEACHER, active: true },
      relations: ['teacherProfile'],
    });

    if (!user || !user.teacherProfile) {
      throw new Error('Teacher not found');
    }

    return this.formatTeacherDetail(user);
  }

  private formatTeacherCard(user: User) {
    const profile = user.teacherProfile;
    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      rating: profile?.rating || 0,
      ratingsCount: profile?.ratingsCount || 0,
      experienceYears: profile?.experienceYears || 0,
      domains: profile?.domains || [],
      region: profile?.regions?.[0] || '',
      pricePer30min: profile?.unitPriceUsd || 5,
      nextAvailableAt: profile?.nextAvailableAt,
      introSnippet: profile?.intro?.substring(0, 100) + '...',
    };
  }

  private formatTeacherDetail(user: User) {
    const profile = user.teacherProfile;
    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      intro: profile?.intro || '',
      certifications: profile?.certifications || [],
      experienceYears: profile?.experienceYears || 0,
      domains: profile?.domains || [],
      region: profile?.regions?.[0] || '',
      gallery: [], // TODO: 實現相簿功能
      rating: profile?.rating || 0,
      ratingsBreakdown: profile?.ratingsBreakdown || {},
      languages: profile?.languages || [],
      pricePolicies: profile?.pricePolicies || [],
      meetingPreference: profile?.meetingPreference || {
        mode: 'zoom_personal',
        defaultUrl: null,
      },
    };
  }
}
