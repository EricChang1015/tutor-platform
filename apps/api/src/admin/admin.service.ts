import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';
import { Purchase, PurchaseType, PurchaseStatus } from '../entities/purchase.entity';
import { Booking } from '../entities/booking.entity';

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
}
