import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';

export class ActivatePurchaseDto {
  @ApiProperty({
    description: '自定義過期天數（管理員專用）',
    example: 70,
    minimum: 1,
    maximum: 365,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  customExpireDays?: number;
}
