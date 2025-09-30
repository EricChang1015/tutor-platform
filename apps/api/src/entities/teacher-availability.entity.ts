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

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  UNAVAILABLE = 'unavailable',
}

@Entity('teacher_availability')
@Index(['teacherId', 'date', 'timeSlot'], { unique: true })
export class TeacherAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'teacher_id' })
  teacherId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacher_id' })
  teacher: User;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD 格式

  @Column({ name: 'time_slot', type: 'int' })
  timeSlot: number; // 0-47，代表 00:00-23:30 的時間槽

  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.AVAILABLE,
  })
  status: AvailabilityStatus;

  @Column({ name: 'booking_id', nullable: true })
  bookingId?: string; // 如果被預約，記錄預約 ID

  @Column({ nullable: true })
  reason?: string; // 不可用的原因

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 虛擬屬性：時間字串
  get timeString(): string {
    const hours = Math.floor(this.timeSlot / 2);
    const minutes = (this.timeSlot % 2) * 30;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // 虛擬屬性：是否可預約
  get canReserve(): boolean {
    return this.status === AvailabilityStatus.AVAILABLE;
  }

  // 虛擬屬性：是否已被預約
  get isReserved(): boolean {
    return this.status === AvailabilityStatus.BOOKED;
  }
}
