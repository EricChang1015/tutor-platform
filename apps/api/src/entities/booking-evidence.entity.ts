import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique, Index } from 'typeorm';
import { Booking } from './booking.entity';
import { Upload } from './upload.entity';
import { User } from './user.entity';

@Entity('booking_evidences')
@Unique(['bookingId', 'fileId'])
@Index(['bookingId'])
export class BookingEvidence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @Column({ name: 'file_id' })
  fileId: string;

  @Column({ name: 'uploaded_by' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @ManyToOne(() => Upload, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'file_id' })
  file: Upload;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;
}

