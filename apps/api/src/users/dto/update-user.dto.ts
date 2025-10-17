import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsObject, ValidateNested, IsArray, IsInt, Min, Max, ArrayUnique } from 'class-validator';
import { Type } from 'class-transformer';

class SettingsDto {
  @ApiProperty({ description: '預設可約時間槽 (0..47)', required: false, type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(47, { each: true })
  @ArrayUnique()
  @Type(() => Number)
  slots?: number[];
}

export class UpdateUserDto {
  @ApiProperty({ description: '姓名', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '頭像 URL', required: false })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({ description: '個人簡介', required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: '電話號碼', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: '時區', required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ description: '設定 JSON（會與既有 settings 合併）', required: false, type: SettingsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SettingsDto)
  settings?: SettingsDto;
}
