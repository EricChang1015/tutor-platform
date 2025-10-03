import { Injectable, NotFoundException, ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewStatus } from '../entities/review.entity';
import { Booking } from '../entities/booking.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
  ) {}

  async findAll(query: any = {}) {
    const {
      teacherId,
      studentId,
      status,
      page = 1,
      pageSize = 20,
    } = query;

    const queryBuilder = this.reviewRepository.createQueryBuilder('review')
      .leftJoinAndSelect('review.student', 'student')
      .leftJoinAndSelect('review.teacher', 'teacher')
      .leftJoinAndSelect('review.booking', 'booking');

    // 篩選條件
    if (teacherId) {
      queryBuilder.andWhere('review.teacher_id = :teacherId', { teacherId });
    }

    if (studentId) {
      queryBuilder.andWhere('review.student_id = :studentId', { studentId });
    }

    if (status) {
      queryBuilder.andWhere('review.status = :status', { status });
    }

    // 排序：最新的在前
    queryBuilder.orderBy('review.created_at', 'DESC');

    // 分頁
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
    };
  }

  async create(createReviewDto: any, studentId: string) {
    const { bookingId, teacherId, rating, comment } = createReviewDto;

    // 檢查 booking 是否存在且屬於該學生
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, studentId },
      relations: ['student', 'teacher'],
    });

    if (!booking) {
      throw new UnprocessableEntityException('Booking not found or not belongs to you');
    }

    // 檢查 booking 是否已完成
    if (booking.status !== 'completed') {
      throw new UnprocessableEntityException('Can only review completed bookings');
    }

    // 檢查是否已經評價過
    const existingReview = await this.reviewRepository.findOne({
      where: { bookingId },
    });

    if (existingReview) {
      throw new ConflictException('This booking has already been reviewed');
    }

    // 建立評價
    const review = this.reviewRepository.create({
      bookingId,
      studentId,
      teacherId,
      rating,
      comment,
      status: ReviewStatus.PENDING, // 需要審核
    });

    return this.reviewRepository.save(review);
  }

  async approve(reviewId: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.APPROVED;

    return this.reviewRepository.save(review);
  }

  async reject(reviewId: string, reason: string) {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.REJECTED;
    review.reason = reason;

    return this.reviewRepository.save(review);
  }
}
