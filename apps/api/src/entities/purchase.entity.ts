import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
// import { ConsumptionRecord } from './consumption-record.entity';

export enum PurchaseType {
  LESSON_CARD = 'lesson_card',
  TRIAL_CARD = 'trial_card',
  COMPENSATION_CARD = 'compensation_card',
  CANCEL_CARD = 'cancel_card',
}

export enum PurchaseStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CONSUMED = 'consumed',
}

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'package_name' })
  packageName: string;

  @Column()
  quantity: number;

  @Column()
  remaining: number;

  @Column({
    type: 'enum',
    enum: PurchaseType,
  })
  type: PurchaseType;

  @Column({ name: 'suggested_label', nullable: true })
  suggestedLabel?: string;

  @CreateDateColumn({ name: 'purchased_at' })
  purchasedAt: Date;

  @Column({ name: 'activated_at', nullable: true })
  activatedAt?: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt?: Date;

  @Column({
    type: 'enum',
    enum: PurchaseStatus,
    default: PurchaseStatus.ACTIVE,
  })
  status: PurchaseStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'json', nullable: true })
  meta?: any;

  // 關聯
  @ManyToOne(() => User, (user) => user.purchases)
  @JoinColumn({ name: 'student_id' })
  student: User;

  // @OneToMany(() => ConsumptionRecord, (record) => record.purchase)
  // consumptions: ConsumptionRecord[];
}
