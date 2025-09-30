import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

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
}
