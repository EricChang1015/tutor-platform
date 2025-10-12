import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { User } from './user.entity';
// import { Material } from './material.entity';
// import { BookingMessage } from './booking-message.entity';
// import { PostClassReport } from './post-class-report.entity';
// import { Settlement } from './settlement.entity';

export enum BookingStatus {
  SCHEDULED = 'scheduled',
  PENDING = 'pending',
  PENDING_TEACHER = 'pending_teacher',
  CANCELED = 'canceled',
  COMPLETED = 'completed',
  NOSHOW = 'noshow',
}

export enum BookingSource {
  STUDENT = 'student',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  SYSTEM = 'system',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'ends_at', type: 'timestamptz' })
  endsAt: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.SCHEDULED,
  })
  status: BookingStatus;

  @Column({
    type: 'enum',
    enum: BookingSource,
    default: BookingSource.STUDENT,
  })
  source: BookingSource;

  @Column({ name: 'material_id', nullable: true })
  materialId?: string;

  @Column({ name: 'course_title', nullable: true })
  courseTitle?: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ name: 'meeting_url', nullable: true })
  meetingUrl?: string;

  @Column({ name: 'last_message_at', nullable: true })
  lastMessageAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'teacher_comment', type: 'text', nullable: true })
  teacherComment?: string;

  @Column({ name: 'teacher_report_submitted_at', type: 'timestamptz', nullable: true })
  teacherReportSubmittedAt?: Date;

  @Column({ name: 'post_class_report_status', type: 'varchar', nullable: true, default: 'none' })
  postClassReportStatus?: string;

  // 關聯
  @ManyToOne(() => User, (user) => user.studentBookings)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ManyToOne(() => User, (user) => user.teacherBookings)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  // @ManyToOne(() => Material, { nullable: true })
  // @JoinColumn({ name: 'material_id' })
  // material?: Material;

  // @OneToMany(() => BookingMessage, (message) => message.booking)
  // messages: BookingMessage[];

  // @OneToOne(() => PostClassReport, (report) => report.booking)
  // postClassReport?: PostClassReport;

  // @OneToOne(() => Settlement, (settlement) => settlement.booking)
  // settlement?: Settlement;
}
