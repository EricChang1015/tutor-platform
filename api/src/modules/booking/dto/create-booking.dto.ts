import { IsString, IsDateString, IsOptional, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  course_id: string;

  @IsUUID()
  teacher_id: string;

  @IsDateString()
  start_at: string; // ISO 8601 format

  @IsDateString()
  end_at: string; // ISO 8601 format

  @IsOptional()
  @IsString()
  meeting_url?: string;

  @IsOptional()
  @IsString()
  meeting_passcode?: string;
}
