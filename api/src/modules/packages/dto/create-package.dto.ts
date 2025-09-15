import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePackageDto {
  @IsUUID()
  studentId!: string; // student_profile.id

  @IsUUID()
  courseId!: string; // courses.id

  @IsInt()
  @Min(1)
  totalSessions!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

