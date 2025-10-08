import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  OTHER = 'other',
}

@Entity('teacher_gallery')
export class TeacherGallery {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.IMAGE,
  })
  type: MediaType;

  @Column({ type: 'text', nullable: true })
  caption?: string;

  @Column({ nullable: true })
  filename?: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  // 關聯
  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;
}
