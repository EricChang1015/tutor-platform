import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';
import { Purchase, PurchaseType, PurchaseStatus } from '../entities/purchase.entity';
import { Booking } from '../entities/booking.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';
import { Material, MaterialType } from '../entities/material.entity';
import { BookingMessage } from '../entities/booking-message.entity';
import { PostClassReport } from '../entities/post-class-report.entity';
import { Settlement } from '../entities/settlement.entity';
import { ConsumptionRecord } from '../entities/consumption-record.entity';
import { Review } from '../entities/review.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TeacherProfile)
    private teacherProfileRepository: Repository<TeacherProfile>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(TeacherAvailability)
    private teacherAvailabilityRepository: Repository<TeacherAvailability>,
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(BookingMessage)
    private bookingMessageRepository: Repository<BookingMessage>,
    @InjectRepository(PostClassReport)
    private postClassReportRepository: Repository<PostClassReport>,
    @InjectRepository(Settlement)
    private settlementRepository: Repository<Settlement>,
    @InjectRepository(ConsumptionRecord)
    private consumptionRecordRepository: Repository<ConsumptionRecord>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async createTeacher(createTeacherDto: any) {
    // 建立用戶帳號
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    
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

    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      active: savedUser.active,
      profile: teacherProfile,
    };
  }

  async createStudent(createStudentDto: any) {
    const hashedPassword = await bcrypt.hash('student123', 10);
    
    const user = this.userRepository.create({
      email: createStudentDto.email,
      passwordHash: hashedPassword,
      role: UserRole.STUDENT,
      name: createStudentDto.name,
      active: createStudentDto.active ?? true,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      active: savedUser.active,
    };
  }

  async grantCards(grantCardsDto: any) {
    const { studentId, packageName, quantity, type, notes } = grantCardsDto;

    // 檢查學生是否存在
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.STUDENT },
    });

    if (!student) {
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

    return {
      id: savedPurchase.id,
      studentId: savedPurchase.studentId,
      packageName: savedPurchase.packageName,
      quantity: savedPurchase.quantity,
      remaining: savedPurchase.remaining,
      type: savedPurchase.type,
      status: savedPurchase.status,
      purchasedAt: savedPurchase.purchasedAt,
    };
  }

  async getReports(query: any = {}) {
    const { from, to, teacherId } = query;

    // 簡化版本：返回模擬統計資料
    return {
      totalBookings: 0,
      completedBookings: 0,
      canceledBookings: 0,
      completionRate: '0.00',
      cancellationRate: '0.00',
      technicalCancellationRate: '0.00',
      period: from && to ? `${from} to ${to}` : 'All time',
      teacherId: teacherId || 'All teachers',
      message: 'Reports feature is working. Database queries will be implemented later.',
    };
  }

  private getSuggestedLabel(type: string): string {
    switch (type) {
      case 'trial_card':
        return '新簽體驗課程';
      case 'lesson_card':
        return '建議升級';
      case 'compensation_card':
        return 'feedback課程補償';
      case 'cancel_card':
        return '取消約課次卡';
      default:
        return '';
    }
  }

  async resetSystemData(): Promise<void> {
    // 清除所有動態資料，保留基本設定
    await this.clearDynamicData();
    // 重新建立預設資料
    await this.createDefaultData();
    console.log('System data has been reset to initial state');
  }

  private async clearDynamicData(): Promise<void> {
    // 清除資料，忽略不存在的表
    const clearTable = async (repository: any, tableName: string) => {
      try {
        await repository.createQueryBuilder().delete().execute();
      } catch (error) {
        console.log(`Table ${tableName} does not exist, skipping...`);
      }
    };

    // 按照外鍵依賴順序清除資料
    await clearTable(this.reviewRepository, 'reviews');
    await clearTable(this.consumptionRecordRepository, 'consumption_records');
    await clearTable(this.settlementRepository, 'settlements');
    await clearTable(this.postClassReportRepository, 'post_class_reports');
    await clearTable(this.bookingMessageRepository, 'booking_messages');
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
      console.log('Error deleting users:', error.message);
    }
  }

  private async createDefaultData(): Promise<void> {
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
  }

  private async createTeacherAvailability(teacherId: string): Promise<void> {
    const availabilityRecords = [];

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
  }

  private async createDefaultMaterials(): Promise<void> {
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
  }
}
