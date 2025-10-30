import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Folder } from './folder.entity';

export enum MaterialType {
  PAGE = 'page',
  PDF = 'pdf',
}

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MaterialType,
  })
  type: MaterialType;

  @Column()
  title: string;

  @Column({ name: 'folder_id', nullable: true })
  folderId?: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'file_url', nullable: true })
  fileUrl?: string;

  @Column({ name: 'preview_url', nullable: true })
  previewUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 關聯關係
  @ManyToOne(() => Folder, { nullable: true })
  @JoinColumn({ name: 'folder_id' })
  folder?: Folder;
}
