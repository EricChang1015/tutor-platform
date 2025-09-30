import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
// import { TeacherGallery } from './teacher-gallery.entity';

@Entity('teacher_profiles')
export class TeacherProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'text' })
  intro: string;

  @Column({ type: 'json', nullable: true })
  certifications?: string[];

  @Column({ name: 'experience_years', default: 0 })
  experienceYears: number;

  @Column({ type: 'json' })
  domains: string[];

  @Column({ type: 'json' })
  regions: string[];

  @Column({ type: 'json', nullable: true })
  languages?: string[];

  @Column({ name: 'price_policies', type: 'json', nullable: true })
  pricePolicies?: any[];

  @Column({ name: 'unit_price_usd', type: 'decimal', precision: 10, scale: 2, default: 5.00 })
  unitPriceUsd: number;

  @Column({ name: 'meeting_preference', type: 'json', nullable: true })
  meetingPreference?: {
    mode: 'zoom_personal' | 'custom_each_time';
    defaultUrl?: string;
  };

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.00 })
  rating: number;

  @Column({ name: 'ratings_count', default: 0 })
  ratingsCount: number;

  @Column({ name: 'ratings_breakdown', type: 'json', nullable: true })
  ratingsBreakdown?: Record<string, number>;

  @Column({ name: 'next_available_at', nullable: true })
  nextAvailableAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 關聯
  @OneToOne(() => User, (user) => user.teacherProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // @OneToMany(() => TeacherGallery, (gallery) => gallery.teacher)
  // gallery: TeacherGallery[];
}
