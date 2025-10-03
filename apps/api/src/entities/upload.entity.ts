import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { FileCategory, FileVisibility } from '../uploads/upload.config';

@Entity('uploads')
@Index(['userId', 'category'])
@Index(['category', 'visibility'])
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({
    type: 'enum',
    enum: FileCategory,
  })
  category: FileCategory;

  @Column({
    type: 'enum',
    enum: FileVisibility,
    default: FileVisibility.PRIVATE,
  })
  visibility: FileVisibility;

  @Column({ name: 'minio_bucket' })
  minioBucket: string;

  @Column({ name: 'minio_key' })
  minioKey: string;

  @Column({ name: 'cdn_url', nullable: true })
  cdnUrl?: string;

  @Column({ name: 'public_url', nullable: true })
  publicUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 關聯
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
