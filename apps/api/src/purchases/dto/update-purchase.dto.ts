import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';
import { PurchaseStatus } from '../../entities/purchase.entity';

export class UpdatePurchaseDto {
  @ApiProperty({
    description: '套餐名稱',
    example: '約課次卡 10張',
    required: false,
  })
  @IsOptional()
  @IsString()
  packageName?: string;

  @ApiProperty({
    description: '剩餘數量',
    example: 8,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  remaining?: number;

  @ApiProperty({
    description: '狀態',
    enum: PurchaseStatus,
    example: PurchaseStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @ApiProperty({
    description: '過期時間 (ISO 8601格式)',
    example: '2025-12-31T23:59:59+08:00',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({
    description: '建議標籤',
    example: '新生體驗包',
    required: false,
  })
  @IsOptional()
  @IsString()
  suggestedLabel?: string;

  @ApiProperty({
    description: '備註',
    example: '管理員手動調整',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
