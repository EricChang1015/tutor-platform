import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';
import { TeacherGallery, MediaType } from '../entities/teacher-gallery.entity';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { UploadsService } from '../uploads/uploads.service';
import { FileCategory } from '../uploads/upload.config';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TeacherProfile)
    private teacherProfileRepository: Repository<TeacherProfile>,
    @InjectRepository(TeacherGallery)
    private teacherGalleryRepository: Repository<TeacherGallery>,
    private uploadsService: UploadsService,
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

  async getTeacherProfile(teacherId: string) {
    const user = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER },
      relations: ['teacherProfile'],
      select: ['id', 'email', 'name', 'phone', 'bio', 'avatarUrl', 'timezone', 'role', 'createdAt']
    });

    if (!user) {
      throw new NotFoundException('Teacher not found');
    }

    const profile = user.teacherProfile;
    const currentYear = new Date().getFullYear();
    const experienceYears = profile?.experienceSince ? currentYear - profile.experienceSince : 0;

    return {
      // 基本用戶資料
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      timezone: user.timezone,
      role: user.role,
      createdAt: user.createdAt,

      // 教師專屬資料
      introduction: profile?.intro || '',
      certificates: profile?.certifications || [],
      experienceSince: profile?.experienceSince,
      experienceYears,
      languages: profile?.languages || [],
      domains: profile?.domains || [],
      region: profile?.regions?.[0] || '',
      hourlyRate: profile?.unitPriceUsd || 0,
      rating: profile?.rating || 0,
      ratingsCount: profile?.ratingsCount || 0,
    };
  }

  async updateTeacherProfile(teacherId: string, updateDto: UpdateTeacherProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER },
      relations: ['teacherProfile']
    });

    if (!user) {
      throw new NotFoundException('Teacher not found');
    }

    let profile = user.teacherProfile;
    if (!profile) {
      // 如果沒有教師資料，創建一個新的
      profile = this.teacherProfileRepository.create({
        userId: teacherId,
        intro: '',
        certifications: [],
        experienceYears: 0,
        domains: [],
        regions: [],
        languages: [],
        unitPriceUsd: 0,
        rating: 0,
        ratingsCount: 0,
      });
    }

    // 更新教師資料
    if (updateDto.introduction !== undefined) {
      profile.intro = updateDto.introduction;
    }
    if (updateDto.certificates !== undefined) {
      profile.certifications = [updateDto.certificates]; // 暫時作為字串陣列處理
    }
    if (updateDto.experienceSince !== undefined) {
      profile.experienceSince = updateDto.experienceSince;
      profile.experienceYears = new Date().getFullYear() - updateDto.experienceSince;
    }
    if (updateDto.languages !== undefined) {
      profile.languages = updateDto.languages;
    }
    if (updateDto.domains !== undefined) {
      profile.domains = updateDto.domains;
    }
    if (updateDto.region !== undefined) {
      profile.regions = [updateDto.region];
    }
    if (updateDto.hourlyRate !== undefined) {
      profile.unitPriceUsd = updateDto.hourlyRate;
    }

    await this.teacherProfileRepository.save(profile);

    return this.getTeacherProfile(teacherId);
  }

  async uploadGalleryFile(teacherId: string, file: any) {
    if (!file) {
      throw new NotFoundException('No file provided');
    }

    // 檢查教師是否存在
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER }
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // 上傳檔案
    const upload = await this.uploadsService.uploadFile(
      teacherId,
      file,
      FileCategory.TEACHER_GALLERY
    );

    // 判斷檔案類型
    let fileType = MediaType.OTHER;
    if (file.mimetype.startsWith('image/')) {
      fileType = MediaType.IMAGE;
    } else if (file.mimetype.startsWith('video/')) {
      fileType = MediaType.VIDEO;
    } else if (file.mimetype.startsWith('audio/')) {
      fileType = MediaType.AUDIO;
    }

    // 保存到相簿
    const galleryItem = new TeacherGallery();
    galleryItem.teacherId = teacherId;
    galleryItem.uploadId = upload.id;
    galleryItem.title = file.originalname;
    galleryItem.mediaType = fileType;
    galleryItem.url = upload.publicUrl || upload.cdnUrl;
    galleryItem.sortOrder = 0;

    await this.teacherGalleryRepository.save(galleryItem);

    return {
      id: galleryItem.id,
      title: galleryItem.title,
      mediaType: galleryItem.mediaType,
      url: galleryItem.url,
      uploadedAt: galleryItem.createdAt,
    };
  }

  async getTeacherGallery(teacherId: string) {
    const gallery = await this.teacherGalleryRepository.find({
      where: { teacherId },
      order: { createdAt: 'DESC' }
    });

    return {
      teacherId,
      items: gallery.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        mediaType: item.mediaType,
        url: item.url,
        sortOrder: item.sortOrder,
        uploadedAt: item.createdAt,
      }))
    };
  }
}
