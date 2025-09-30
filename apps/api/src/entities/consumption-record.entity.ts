import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { User } from './user.entity';
import { Purchase, PurchaseType } from './purchase.entity';

export enum ConsumptionReason {
  BOOKING = 'booking',
  CANCEL_TIER_1 = 'cancel_tier_1',
  CANCEL_TIER_2 = 'cancel_tier_2',
  CANCEL_TIER_LOCKED = 'cancel_tier_locked',
  ADMIN_ADJUST = 'admin_adjust',
  REFUND = 'refund',
}

@Entity('consumption_records')
export class ConsumptionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id', nullable: true })
  bookingId?: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'purchase_id' })
  purchaseId: string;

  @Column({
    type: 'enum',
    enum: PurchaseType,
  })
  type: PurchaseType;

  @Column({ default: 1 })
  amount: number;

  @Column({
    type: 'enum',
    enum: ConsumptionReason,
  })
  reason: ConsumptionReason;

  @Column({ type: 'jsonb', nullable: true })
  meta?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 關聯
  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking?: Booking;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  // @ManyToOne(() => Purchase, (purchase) => purchase.consumptions)
  // @JoinColumn({ name: 'purchase_id' })
  // purchase: Purchase;
}
