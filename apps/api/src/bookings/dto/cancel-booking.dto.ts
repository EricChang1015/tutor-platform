import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

export enum CancelCause {
  STUDENT_REQUEST = 'student_request',
  TEACHER_REQUEST = 'teacher_request',
  ADMIN_FORCE = 'admin_force',
  TECHNICAL_ISSUE = 'technical_issue',
}

export class CancelBookingDto {
  @ApiProperty({
    description: '取消原因',
    example: '臨時有事無法上課',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: '取消原因類型',
    enum: CancelCause,
    example: CancelCause.STUDENT_REQUEST,
    required: false,
  })
  @IsOptional()
  @IsEnum(CancelCause)
  cause?: CancelCause;

  @ApiProperty({
    description: '免除政策/扣卡 (僅管理員可用)',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  waivePolicy?: boolean = false;
}
