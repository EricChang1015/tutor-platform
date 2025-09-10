import { IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class ResolveQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'teacherId must be a UUID' })
  teacherId?: string;

  @IsUUID('4', { message: 'courseId must be a UUID' })
  courseId!: string;

  @IsOptional()
  @IsISO8601({}, { message: 'at must be an ISO8601 datetime string' })
  at?: string; // ISO string
}