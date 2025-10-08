import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsArray, IsNumber, Min } from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ description: 'Email地址', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '用戶姓名', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: '用戶角色', enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: '初始密碼', example: 'password123', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ description: '電話號碼', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '個人簡介', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: '時區', example: 'Asia/Taipei', required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ description: '帳號是否啟用', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateTeacherDto extends CreateUserDto {
  @ApiProperty({ description: '教師自我介紹', required: false })
  @IsOptional()
  @IsString()
  intro?: string;

  @ApiProperty({
    description: '證書資訊',
    example: ['TESOL', 'IELTS'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiProperty({ description: '教學經驗年數', example: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experienceYears?: number;

  @ApiProperty({ description: '開始教學年份', example: 2020, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1990)
  experienceSince?: number;

  @ApiProperty({ 
    description: '教學領域', 
    example: ['English', 'Conversation'], 
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  domains?: string[];

  @ApiProperty({ 
    description: '教學地區', 
    example: ['Taiwan', 'Online'], 
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @ApiProperty({ 
    description: '語言能力', 
    example: ['English', 'Chinese'], 
    required: false 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ description: '每30分鐘課程價格(USD)', example: 25.00, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPriceUsd?: number;

  @ApiProperty({
    description: '會議偏好設定',
    example: { mode: 'zoom_personal', defaultUrl: 'https://zoom.us/j/123456789' },
    required: false
  })
  @IsOptional()
  meetingPreference?: {
    mode: 'zoom_personal' | 'custom_each_time';
    defaultUrl?: string;
  };
}
