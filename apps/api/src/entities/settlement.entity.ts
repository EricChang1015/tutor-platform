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

export enum SettlementStatus {
  PENDING = 'pending',
  BLOCKED = 'blocked',
  READY = 'ready',
  SETTLED = 'settled',
}

@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.PENDING,
  })
  status: SettlementStatus;

  @Column({ name: 'teacher_unit_usd', type: 'decimal', precision: 10, scale: 2, nullable: true })
  teacherUnitUsd?: number;

  @Column({ name: 'payable_at', nullable: true })
  payableAt?: Date;

  @Column({ name: 'settled_at', nullable: true })
  settledAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 關聯
  // @OneToOne(() => Booking, (booking) => booking.settlement)
  // @JoinColumn({ name: 'booking_id' })
  // booking: Booking;
}
