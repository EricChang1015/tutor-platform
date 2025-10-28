import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';
import { TeacherGallery, MediaType } from '../entities/teacher-gallery.entity';
import { Purchase, PurchaseType, PurchaseStatus } from '../entities/purchase.entity';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { Material, MaterialType } from '../entities/material.entity';
import { Review } from '../entities/review.entity';
import { UploadsService } from '../uploads/uploads.service';
import { FileCategory } from '../uploads/upload.config';
import { CreateUserDto, CreateTeacherDto } from './dto/create-user.dto';
import { UpdateUserDto, UpdateTeacherProfileDto, ResetPasswordDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { LoggerService } from '../common/logger.service';

@Injectable()
export class AdminService {
  private readonly logger = new LoggerService('AdminService');

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TeacherProfile)
    private teacherProfileRepository: Repository<TeacherProfile>,
    @InjectRepository(TeacherGallery)
    private teacherGalleryRepository: Repository<TeacherGallery>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(TeacherAvailability)
    private teacherAvailabilityRepository: Repository<TeacherAvailability>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    private uploadsService: UploadsService,
  ) {}

  // === 用戶管理功能 ===

  async getUsers(query: UserQueryDto) {
    const { page, pageSize, role, active, search, sortBy, sortOrder } = query;
    this.logger.logMethodCall('getUsers', { page, pageSize, role, active, search, sortBy, sortOrder });

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.teacherProfile', 'profile')
      .select([
        'user.id',
        'user.email',
        'user.role',
        'user.name',
        'user.phone',
        'user.bio',
        'user.avatarUrl',
        'user.timezone',
        'user.active',
        'user.createdAt',
        'user.updatedAt',
        'profile.experienceYears',
        'profile.domains',
        'profile.regions',
        'profile.unitPriceUsd'
      ]);

    // 篩選條件
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (active !== undefined) {
      queryBuilder.andWhere('user.active = :active', { active });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // 排序
    const validSortFields = ['createdAt', 'name', 'email', 'role'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`user.${sortField}`, sortOrder);

    // 分頁
    const total = await queryBuilder.getCount();
    const items = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const result = {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
    this.logger.logMethodResult('getUsers', { total, page, pageSize });
    return result;
  }

  async getUserById(id: string) {
    this.logger.logMethodCall('getUserById', { id });
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['teacherProfile'],
      select: [
        'id', 'email', 'role', 'name', 'phone', 'bio', 'avatarUrl',
        'timezone', 'locale', 'active', 'createdAt', 'updatedAt'
      ]
    });

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('User not found');
    }

    this.logger.logMethodResult('getUserById', { id: user.id, role: user.role });
    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    this.logger.logMethodCall('createUser', { email: createUserDto?.email, role: createUserDto?.role });
    // 檢查email是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      this.logger.warn(`Email already exists: ${createUserDto.email}`);
      throw new BadRequestException('Email already exists');
    }

    const password = createUserDto.password || 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // 返回時不包含密碼
    const { passwordHash, ...result } = savedUser as any;
    this.logger.logMethodResult('createUser', { id: (savedUser as any).id, email: (savedUser as any).email });
    return result;
  }

  async createTeacherWithProfile(createTeacherDto: CreateTeacherDto) {
    this.logger.logMethodCall('createTeacherWithProfile', { email: createTeacherDto?.email, name: createTeacherDto?.name });
    // 檢查email是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { email: createTeacherDto.email }
    });

    if (existingUser) {
      this.logger.warn(`Email already exists: ${createTeacherDto.email}`);
      throw new BadRequestException('Email already exists');
    }

    const password = createTeacherDto.password || 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 創建用戶
    const user = this.userRepository.create({
      email: createTeacherDto.email,
      name: createTeacherDto.name,
      role: UserRole.TEACHER,
      phone: createTeacherDto.phone,
      bio: createTeacherDto.bio,
      timezone: createTeacherDto.timezone,
      active: createTeacherDto.active ?? true,
      passwordHash: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    // 創建教師檔案
    const teacherProfile = this.teacherProfileRepository.create({
      userId: savedUser.id,
      intro: createTeacherDto.intro,
      certifications: createTeacherDto.certifications,
      experienceYears: createTeacherDto.experienceYears,
      experienceSince: createTeacherDto.experienceSince,
      domains: createTeacherDto.domains || [],
      regions: createTeacherDto.regions || [],
      languages: createTeacherDto.languages || [],
      unitPriceUsd: createTeacherDto.unitPriceUsd || 25.00,
      meetingPreference: createTeacherDto.meetingPreference || { mode: 'zoom_personal' },
    });

    await this.teacherProfileRepository.save(teacherProfile);

    const result = {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      active: savedUser.active,
      profile: teacherProfile,
    };
    this.logger.logMethodResult('createTeacherWithProfile', { id: result.id });
    return result;
  }

  async createTeacher(createTeacherDto: any) {
    this.logger.logMethodCall('createTeacher', { email: createTeacherDto?.email, name: createTeacherDto?.name });
    // 建立用戶帳號
    const password = createTeacherDto.password || 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email: createTeacherDto.email,
      passwordHash: hashedPassword,
      role: UserRole.TEACHER,
      name: createTeacherDto.name,
      active: createTeacherDto.active ?? true,
    });

    const savedUser = await this.userRepository.save(user);

    // 建立教師檔案
    const teacherProfile = this.teacherProfileRepository.create({
      userId: savedUser.id,
      intro: createTeacherDto.intro,
      certifications: createTeacherDto.certifications,
      experienceYears: createTeacherDto.experienceYears,
      domains: createTeacherDto.domains,
      regions: createTeacherDto.regions,
      unitPriceUsd: createTeacherDto.unitPriceUSD || 5.00,
    });

    await this.teacherProfileRepository.save(teacherProfile);

    const result = {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      active: savedUser.active,
      profile: teacherProfile,
    };
    this.logger.logMethodResult('createTeacher', { id: result.id });
    return result;
  }

  async createStudent(createStudentDto: any) {
    this.logger.logMethodCall('createStudent', { email: createStudentDto?.email, name: createStudentDto?.name });
    const password = createStudentDto.password || 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email: createStudentDto.email,
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      name: createStudentDto.name,
      active: createStudentDto.active ?? true,
    });

    const savedUser = await this.userRepository.save(user);

    const result = {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      active: savedUser.active,
    };
    this.logger.logMethodResult('createStudent', { id: result.id });
    return result;
  }

  async grantCards(grantCardsDto: any) {
    const { studentId, packageName, quantity, type, notes } = grantCardsDto;
    this.logger.logMethodCall('grantCards', { studentId, packageName, quantity, type });

    // 檢查學生是否存在
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.STUDENT },
    });

    if (!student) {
      this.logger.warn(`Student not found: ${studentId}`);
      throw new Error('Student not found');
    }

    // 建立購買記錄
    const purchase = this.purchaseRepository.create({
      studentId,
      packageName,
      quantity,
      remaining: quantity,
      type: type as PurchaseType,
      status: PurchaseStatus.DRAFT,
      notes,
      suggestedLabel: this.getSuggestedLabel(type),
    });

    const savedPurchase = await this.purchaseRepository.save(purchase);

    const result = {
      id: savedPurchase.id,
      studentId: savedPurchase.studentId,
      packageName: savedPurchase.packageName,
      quantity: savedPurchase.quantity,
      remaining: savedPurchase.remaining,
      type: savedPurchase.type,
      status: savedPurchase.status,
      purchasedAt: savedPurchase.purchasedAt,
    };
    this.logger.logMethodResult('grantCards', { id: result.id, studentId: result.studentId });
    return result;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    this.logger.logMethodCall('updateUser', { id });
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('User not found');
    }

    // 更新用戶資料
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // 返回更新後的用戶資料（不包含密碼）
    const { passwordHash, ...result } = user as any;
    this.logger.logMethodResult('updateUser', { id: user.id });
    return result;
  }

  async updateTeacherProfile(teacherId: string, updateProfileDto: UpdateTeacherProfileDto) {
    this.logger.logMethodCall('updateTeacherProfile', { teacherId });
    // 檢查教師是否存在
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER }
    });

    if (!teacher) {
      this.logger.warn(`Teacher not found: ${teacherId}`);
      throw new NotFoundException('Teacher not found');
    }

    // 查找或創建教師檔案
    let profile = await this.teacherProfileRepository.findOne({
      where: { userId: teacherId }
    });

    if (!profile) {
      profile = this.teacherProfileRepository.create({
        userId: teacherId,
        ...updateProfileDto
      });
    } else {
      Object.assign(profile, updateProfileDto);
    }

    await this.teacherProfileRepository.save(profile);
    this.logger.logMethodResult('updateTeacherProfile', { teacherId, hasProfile: !!profile?.id });
    return profile;
  }

  async resetUserPassword(id: string, resetPasswordDto: ResetPasswordDto) {
    this.logger.logMethodCall('resetUserPassword', { id, forceChangeOnNextLogin: resetPasswordDto?.forceChangeOnNextLogin });
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    await this.userRepository.update(id, {
      passwordHash: hashedPassword,
      // 可以添加強制修改密碼的邏輯
    });

    const result = {
      message: 'Password reset successfully',
      forceChangeOnNextLogin: resetPasswordDto.forceChangeOnNextLogin || false
    };
    this.logger.logMethodResult('resetUserPassword', { id });
    return result;
  }

  async uploadTeacherGalleryFile(teacherId: string, file: any) {
    this.logger.logMethodCall('uploadTeacherGalleryFile', { teacherId, mime: file?.mimetype, size: file?.size });
    // 檢查教師是否存在
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER }
    });

    if (!teacher) {
      this.logger.warn(`Teacher not found: ${teacherId}`);
      throw new NotFoundException('Teacher not found');
    }

    // 上傳檔案
    const upload = await this.uploadsService.uploadFile(
      teacherId,
      file,
      FileCategory.TEACHER_GALLERY
    );

    // 判斷檔案類型
    let mediaType = MediaType.OTHER;
    if (file.mimetype.startsWith('image/')) {
      mediaType = MediaType.IMAGE;
    } else if (file.mimetype.startsWith('video/')) {
      mediaType = MediaType.VIDEO;
    } else if (file.mimetype.startsWith('audio/')) {
      mediaType = MediaType.AUDIO;
    }

    // 保存到教師相簿
    const galleryItem = this.teacherGalleryRepository.create({
      teacherId,
      uploadId: upload.id,
      title: file.originalname,
      description: '',
      mediaType,
      url: upload.publicUrl || upload.cdnUrl,
      sortOrder: 0
    });

    await this.teacherGalleryRepository.save(galleryItem);

    const result = {
      id: galleryItem.id,
      title: galleryItem.title,
      mediaType: galleryItem.mediaType,
      url: galleryItem.url,
      uploadedAt: galleryItem.createdAt
    };
    this.logger.logMethodResult('uploadTeacherGalleryFile', { id: result.id, mediaType: result.mediaType });
    return result;
  }

  async deleteTeacherGalleryFile(teacherId: string, fileId: string) {
    this.logger.logMethodCall('deleteTeacherGalleryFile', { teacherId, fileId });
    const galleryItem = await this.teacherGalleryRepository.findOne({
      where: { id: fileId, teacherId }
    });

    if (!galleryItem) {
      this.logger.warn(`Gallery file not found: ${fileId} for teacher ${teacherId}`);
      throw new NotFoundException('Gallery file not found');
    }

    // 刪除檔案記錄
    await this.teacherGalleryRepository.remove(galleryItem);

    // 可以選擇是否同時刪除實際檔案
    // await this.uploadsService.deleteFile(galleryItem.uploadId, teacherId, 'admin');

    const result = { message: 'Gallery file deleted successfully' };
    this.logger.logMethodResult('deleteTeacherGalleryFile', { fileId });
    return result;
  }

  async deleteUser(id: string) {
    this.logger.logMethodCall('deleteUser', { id });
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException('User not found');
    }

    // 軟刪除：設置為非活躍狀態
    await this.userRepository.update(id, { active: false });

    const result = { message: 'User deactivated successfully' };
    this.logger.logMethodResult('deleteUser', { id });
    return result;
  }

  async listAdminBookings(query: any = {}) {
    const { page = 1, pageSize = 20, from, to, teacherId, studentId, statusExact, hasReport, hasEvidence } = query;
    this.logger.logMethodCall('listAdminBookings', { page, pageSize, from, to, teacherId, studentId, statusExact, hasReport, hasEvidence });
    const qb = this.bookingRepository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.student', 'student')
      .leftJoinAndSelect('b.teacher', 'teacher');

    if (from) qb.andWhere('b.startsAt >= :from', { from });
    if (to) qb.andWhere('b.startsAt <= :to', { to });
    if (teacherId) qb.andWhere('b.teacherId = :teacherId', { teacherId });
    if (studentId) qb.andWhere('b.studentId = :studentId', { studentId });
    if (statusExact) qb.andWhere('b.status = :status', { status: statusExact });
    if (hasReport !== undefined) {
      if (String(hasReport) === 'true') qb.andWhere('b.teacherReportSubmittedAt IS NOT NULL');
      else qb.andWhere('b.teacherReportSubmittedAt IS NULL');
    }
    if (hasEvidence !== undefined) {
      if (String(hasEvidence) === 'true') {
        qb.andWhere("EXISTS (SELECT 1 FROM booking_evidences e WHERE e.booking_id = b.id)");
      } else {
        qb.andWhere("NOT EXISTS (SELECT 1 FROM booking_evidences e WHERE e.booking_id = b.id)");
      }
    }

    const total = await qb.getCount();
    const items = await qb.orderBy('b.startsAt', 'DESC').skip((page - 1) * pageSize).take(pageSize).getMany();

    const mapped = await Promise.all(items.map(async (booking) => {
      const evidenceCount = await this.bookingRepository.query('SELECT COUNT(1) AS c FROM booking_evidences WHERE booking_id = $1', [booking.id]);
      const ec = parseInt(evidenceCount?.[0]?.c || '0', 10);
      const hasReportFlag = !!(booking as any).teacherReportSubmittedAt;
      const percent = (hasReportFlag ? 30 : 0) + (ec > 0 ? 30 : 0);
      return {
        id: booking.id,
        teacher: { id: booking.teacherId, name: booking.teacher?.name },
        student: { id: booking.studentId, name: booking.student?.name },
        startsAt: booking.startsAt,
        endsAt: booking.endsAt,
        status: booking.status,
        postClass: {
          teacherReportSubmittedAt: (booking as any).teacherReportSubmittedAt || null,
          teacherComment: (booking as any).teacherComment || null,
          reportStatus: (booking as any).postClassReportStatus || 'none',
          evidenceCount: ec,
        },
        progress: { percent, attendance: 'unknown', hasReport: hasReportFlag, evidenceCount: ec, settlementStatus: 'pending' },
      };
    }));

    const result = { items: mapped, page, pageSize, total };
    this.logger.logMethodResult('listAdminBookings', { total, page, pageSize });
    return result;
  }

  async getBookingsStats() {
    this.logger.logMethodCall('getBookingsStats', {});
    const totalBookings = await this.bookingRepository.count();
    const completedBookings = await this.bookingRepository.count({ where: { status: BookingStatus.COMPLETED } });
    const scheduledBookings = await this.bookingRepository.count({ where: { status: BookingStatus.SCHEDULED } });
    const canceledBookings = await this.bookingRepository.count({ where: { status: BookingStatus.CANCELED } });

    const result = {
      total: totalBookings,
      completed: completedBookings,
      scheduled: scheduledBookings,
      canceled: canceledBookings
    };
    this.logger.logMethodResult('getBookingsStats', result);
    return result;
  }

  async getReports(query: any = {}) {
    let { from, to, teacherId, month } = query;
    this.logger.logMethodCall('getReports', { from, to, teacherId, month });

    // 支援 month=YYYY-MM 快捷查詢
    if (month && (!from && !to)) {
      try {
        const [y, m] = String(month).split('-').map((v: string) => parseInt(v, 10));
        if (y && m) {
          const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
          const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1, 0, 0, 0));
          from = start.toISOString();
          to = end.toISOString();
        }
      } catch (_) {}
    }

    const qb = this.bookingRepository.createQueryBuilder('b');
    if (from) qb.andWhere('b.startsAt >= :from', { from });
    if (to) qb.andWhere('b.startsAt <= :to', { to });
    if (teacherId) qb.andWhere('b.teacherId = :teacherId', { teacherId });

    const total = await qb.getCount();

    const completed = await qb.clone().andWhere('b.status = :s', { s: BookingStatus.COMPLETED }).getCount();
    const canceled = await qb.clone().andWhere('b.status = :s', { s: BookingStatus.CANCELED }).getCount();
    const noshow = await qb.clone().andWhere('b.status = :s', { s: BookingStatus.NOSHOW }).getCount();

    const completionRate = total > 0 ? (completed / total) : 0;
    const cancellationRate = total > 0 ? (canceled / total) : 0;
    const noshowRate = total > 0 ? (noshow / total) : 0;

    // 結算：統計已完成課時（分鐘/小時）
    const whereClauses: string[] = ["status = 'completed'"];
    const params: any[] = [];
    if (teacherId) { whereClauses.push('teacher_id = $' + (params.length + 1)); params.push(teacherId); }
    if (from) { whereClauses.push('starts_at >= $' + (params.length + 1)); params.push(from); }
    if (to) { whereClauses.push('starts_at < $' + (params.length + 1)); params.push(to); }

    const sql = `SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (ends_at - starts_at)) / 60), 0) AS minutes
                 FROM bookings
                 ${whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''}`;
    const sumRows = await this.bookingRepository.query(sql, params);
    const completedMinutes = Math.round(parseFloat(sumRows?.[0]?.minutes || '0'));
    const completedHours = Math.round((completedMinutes / 60) * 100) / 100; // 保留兩位小數


    const financials = {
      payableUSDReady: 0,
      payableUSDSettled: 0,
      outstandingUSD: 0,
    };

    const result = {
      bookings: {
        total,
        completed,
        canceled,
        noshow,
        technicalCanceled: 0,
        completionRate,
        cancelRate: cancellationRate,
        noshowRate,
        technicalCancelRate: 0,
      },
      settlement: {
        completedMinutes,
        completedHours,
        month: month || undefined,
        teacherId: teacherId || undefined,
        from: from || undefined,
        to: to || undefined,
      },
      financials,
      period: from && to ? `${from} to ${to}` : 'all',
      teacherId: teacherId || null,
    };
    this.logger.logMethodResult('getReports', { total, completed, canceled, noshow, completedMinutes, teacherId, month });
    return result;
  }

  private getSuggestedLabel(type: string): string {
    this.logger.logMethodCall('getSuggestedLabel', { type });
    let label = '';
    switch (type) {
      case 'trial_card':
        label = '新簽體驗課程';
        break;
      case 'lesson_card':
        label = '建議升級';
        break;
      case 'compensation_card':
        label = 'feedback課程補償';
        break;
      case 'cancel_card':
        label = '取消約課次卡';
        break;
      default:
        label = '';
    }
    this.logger.logMethodResult('getSuggestedLabel', { type, label });
    return label;
  }

  async resetSystemData(): Promise<void> {
    this.logger.logMethodCall('resetSystemData', {});
    // 清除所有動態資料，保留基本設定
    await this.clearDynamicData();
    // 重新建立預設資料（僅在資料庫為空時）
    await this.createDefaultDataIfNeeded();
    this.logger.logMethodResult('resetSystemData', { ok: true });
  }

  private async clearDynamicData(): Promise<void> {
    this.logger.logMethodCall('clearDynamicData', {});
    // 清除資料，忽略不存在的表
    const clearTable = async (repository: any, tableName: string) => {
      try {
        await repository.createQueryBuilder().delete().execute();
      } catch (error) {
        this.logger.warn(`Table ${tableName} does not exist, skipping...`);
      }
    };

    // 按照外鍵依賴順序清除資料
    await clearTable(this.reviewRepository, 'reviews');
    await clearTable(this.teacherAvailabilityRepository, 'teacher_availability');
    await clearTable(this.bookingRepository, 'bookings');
    await clearTable(this.purchaseRepository, 'purchases');
    await clearTable(this.materialRepository, 'materials');
    await clearTable(this.teacherProfileRepository, 'teacher_profiles');

    // 刪除非管理員用戶
    try {
      await this.userRepository.delete({ role: UserRole.TEACHER });
      await this.userRepository.delete({ role: UserRole.STUDENT });
    } catch (error) {
      this.logger.warn(`Error deleting users: ${error.message}`);
    }
    this.logger.logMethodResult('clearDynamicData', { ok: true });
  }

  private async createDefaultDataIfNeeded(): Promise<void> {
    this.logger.logMethodCall('createDefaultDataIfNeeded', {});
    // 檢查是否已有預設資料（除了admin用戶）
    const existingUsers = await this.userRepository.count({
      where: [
        { role: UserRole.TEACHER },
        { role: UserRole.STUDENT }
      ]
    });

    if (existingUsers > 0) {
      this.logger.debug('Default data already exists, skipping creation');
      return;
    }

    this.logger.debug('Creating default data...');

    // 建立預設教師
    const teacherUser = await this.createTeacher({
      email: 'teacher1@example.com',
      name: 'Teacher One',
      intro: 'Experienced English teacher with 5+ years of teaching experience.',
      experienceYears: 5,
      domains: ['English', 'Conversation'],
      regions: ['Taiwan'],
      unitPriceUSD: 25
    });

    const teacherUser2 = await this.createTeacher({
      email: 'teacher2@example.com',
      name: 'Teacher Two',
      intro: 'Native English speaker specializing in pronunciation and accent training.',
      experienceYears: 8,
      domains: ['English', 'Pronunciation', 'IELTS'],
      regions: ['Taiwan', 'Online'],
      unitPriceUSD: 30
    });

    // 建立預設學生
    const student1 = await this.createStudent({
      email: 'student1@example.com',
      name: 'Student One'
    });

    const student2 = await this.createStudent({
      email: 'student2@example.com',
      name: 'Student Two'
    });

    // 為學生授予課卡
    await this.grantCards({
      studentId: student1.id,
      packageName: 'Standard Lesson Package',
      quantity: 10,
      type: 'lesson_card',
      notes: 'Initial lesson cards'
    });

    await this.grantCards({
      studentId: student2.id,
      packageName: 'Trial Package',
      quantity: 2,
      type: 'trial_card',
      notes: 'New student trial cards'
    });

    // 建立教師可用時間
    await this.createTeacherAvailability(teacherUser.id);
    await this.createTeacherAvailability(teacherUser2.id);

    // 建立預設教材
    await this.createDefaultMaterials();
    this.logger.logMethodResult('createDefaultDataIfNeeded', { createdTeachers: 2, createdStudents: 2 });
  }

  private async createTeacherAvailability(teacherId: string): Promise<void> {
    this.logger.logMethodCall('createTeacherAvailability', { teacherId });
    const availabilityRecords = [] as any[];

    // 為未來7天建立可用時間
    for (let day = 1; day <= 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0];

      // 每天 09:00-23:30 (時間槽 18-47)
      for (let slot = 18; slot <= 47; slot++) {
        availabilityRecords.push({
          teacherId,
          date: dateStr,
          timeSlot: slot,
          status: 'available'
        });
      }
    }

    await this.teacherAvailabilityRepository.save(availabilityRecords);
    this.logger.logMethodResult('createTeacherAvailability', { teacherId, created: availabilityRecords.length });
  }

  private async createDefaultMaterials(): Promise<void> {
    this.logger.logMethodCall('createDefaultMaterials', {});
    const materials = [
      {
        title: 'Free Talking',
        type: MaterialType.PAGE,
        folderId: null,
        active: true
      },
      {
        title: 'Business English Basics',
        type: MaterialType.PAGE,
        folderId: null,
        active: true
      },
      {
        title: 'IELTS Speaking Practice',
        type: MaterialType.PDF,
        folderId: null,
        active: true
      },
      {
        title: 'Grammar Fundamentals',
        type: MaterialType.PAGE,
        folderId: null,
        active: true
      }
    ];

    await this.materialRepository.save(materials);
    this.logger.logMethodResult('createDefaultMaterials', { count: materials.length });
  }
}
