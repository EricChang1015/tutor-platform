import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { TeacherProfile } from './teacher-profile.entity';
import { Booking } from './booking.entity';
import { Purchase } from './purchase.entity';
// import { Review } from './review.entity';
// import { Notification } from './notification.entity';

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column()
  name: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ default: 'Asia/Taipei' })
  timezone: string;

  @Column({ default: 'zh-TW' })
  locale: string;

  @Column({ type: 'json', nullable: true })
  settings?: any;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  // 關聯
  @OneToOne(() => TeacherProfile, (profile) => profile.user)
  teacherProfile?: TeacherProfile;

  @OneToMany(() => Booking, (booking) => booking.student)
  studentBookings: Booking[];

  @OneToMany(() => Booking, (booking) => booking.teacher)
  teacherBookings: Booking[];

  @OneToMany(() => Purchase, (purchase) => purchase.student)
  purchases: Purchase[];

  // @OneToMany(() => Review, (review) => review.student)
  // reviews: Review[];

  // @OneToMany(() => Notification, (notification) => notification.user)
  // notifications: Notification[];
}
