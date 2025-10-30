import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFolderDto {
  @ApiProperty({ description: '資料夾名稱' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: '父資料夾 ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: '資料夾描述' })
  @IsOptional()
  @IsString()
  description?: string;
}
