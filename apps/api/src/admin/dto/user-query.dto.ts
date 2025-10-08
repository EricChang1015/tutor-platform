import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../../entities/user.entity';

export class UserQueryDto {
  @ApiProperty({ description: '頁數', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每頁筆數', example: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 20;

  @ApiProperty({ description: '用戶角色篩選', enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ description: '帳號狀態篩選', required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @ApiProperty({ description: '搜尋關鍵字 (姓名或Email)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: '排序欄位', 
    example: 'createdAt',
    enum: ['createdAt', 'name', 'email', 'role'],
    required: false 
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    description: '排序方向', 
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    required: false 
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
