import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialType } from '../../entities/material.entity';

export class CreateMaterialDto {
  @ApiProperty({ enum: MaterialType, description: '教材類型' })
  @IsEnum(MaterialType)
  type: MaterialType;

  @ApiProperty({ description: '教材標題' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: '資料夾 ID' })
  @IsOptional()
  @IsUUID()
  folderId?: string;

  @ApiPropertyOptional({ description: '教材內容（僅適用於 page 類型）' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: '檔案 URL（僅適用於 pdf 類型）' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ description: '預覽 URL' })
  @IsOptional()
  @IsString()
  previewUrl?: string;

  @ApiPropertyOptional({ description: '元資料' })
  @IsOptional()
  meta?: any;
}