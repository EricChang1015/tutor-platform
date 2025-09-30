import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('post_class_reports')
export class PostClassReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({ name: 'teacher_report_submitted_at', nullable: true })
  teacherReportSubmittedAt?: Date;

  @Column({ name: 'teacher_rubrics', type: 'jsonb', nullable: true })
  teacherRubrics?: any;

  @Column({ name: 'evidence_urls', type: 'jsonb', nullable: true })
  evidenceUrls?: string[];

  @Column({ name: 'student_goal', type: 'text', nullable: true })
  studentGoal?: string;

  @Column({ name: 'student_goal_submitted_at', nullable: true })
  studentGoalSubmittedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 關聯
  // @OneToOne(() => Booking, (booking) => booking.postClassReport)
  // @JoinColumn({ name: 'booking_id' })
  // booking: Booking;
}
