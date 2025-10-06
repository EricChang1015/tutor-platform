import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsEnum, IsDateString, Min, Max } from 'class-validator';

export enum BookingSource {
  STUDENT = 'student',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  SYSTEM = 'system',
}

export class CreateBookingDto {
  @ApiProperty({
    description: '教師ID',
    example: '3ac75e02-e751-440d-a21a-ffe8f6f1b79b',
  })
  @IsString()
  teacherId: string;

  @ApiProperty({
    description: '預約開始時間 (ISO 8601格式含時區)',
    example: '2025-10-06T14:00:00+08:00',
    format: 'date-time',
  })
  @IsDateString()
  startsAt: string;

  @ApiProperty({
    description: '預約時長（分鐘）',
    example: 30,
    default: 30,
    minimum: 30,
    maximum: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(120)
  durationMinutes?: number = 30;

  @ApiProperty({
    description: '時區 (IANA格式)',
    example: 'Asia/Taipei',
    default: 'Asia/Taipei',
  })
  @IsOptional()
  @IsString()
  timezone?: string = 'Asia/Taipei';

  @ApiProperty({
    description: '課程標題',
    example: '英語會話練習',
    required: false,
  })
  @IsOptional()
  @IsString()
  courseTitle?: string;

  @ApiProperty({
    description: '預約留言',
    example: '希望練習商務英語對話',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiProperty({
    description: '教材ID',
    example: 'material-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiProperty({
    description: '預約來源',
    enum: BookingSource,
    default: BookingSource.STUDENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(BookingSource)
  source?: BookingSource = BookingSource.STUDENT;

  @ApiProperty({
    description: '學生ID (管理員代約時使用)',
    example: 'student-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  studentId?: string;
}
