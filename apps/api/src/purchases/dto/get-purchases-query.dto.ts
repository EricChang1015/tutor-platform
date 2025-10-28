import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPurchasesQueryDto {
  @ApiPropertyOptional({ description: '分頁：頁碼', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '分頁：每頁數量', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '管理員可指定的 studentId（只有 admin 可用）'})
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({ description: '排序，例如 purchasedAt:desc 或 purchasedAt:asc', example: 'purchasedAt:desc' })
  @IsOptional()
  @IsString()
  sort?: string;
}

