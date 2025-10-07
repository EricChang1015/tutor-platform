import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsEnum, IsOptional, Min, Max } from 'class-validator';
import { PurchaseType } from '../../entities/purchase.entity';

export class CreatePurchaseDto {
  @ApiProperty({
    description: '學生ID',
    example: 'd90d434c-87c9-4eba-bdbc-b4e3fb32f1d7',
  })
  @IsString()
  studentId: string;

  @ApiProperty({
    description: '套餐名稱',
    example: '約課次卡 10張',
  })
  @IsString()
  packageName: string;

  @ApiProperty({
    description: '卡片數量',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;

  @ApiProperty({
    description: '卡片類型',
    enum: PurchaseType,
    example: PurchaseType.LESSON_CARD,
  })
  @IsEnum(PurchaseType)
  type: PurchaseType;

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
    example: '新生註冊贈送',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
