import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator';

export class UpdateTeacherProfileDto {
  @ApiProperty({ description: '教師自我介紹', required: false })
  @IsString()
  @IsOptional()
  introduction?: string;

  @ApiProperty({ description: '證書資訊', required: false })
  @IsString()
  @IsOptional()
  certificates?: string;

  @ApiProperty({ description: '開始教學年份', required: false, example: 2020 })
  @IsNumber()
  @Min(1990)
  @Max(new Date().getFullYear())
  @IsOptional()
  experienceSince?: number;

  @ApiProperty({ description: '可教授語言', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @ApiProperty({ description: '教學領域', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  domains?: string[];

  @ApiProperty({ description: '教學地區', required: false })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiProperty({ description: '時薪', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;
}
