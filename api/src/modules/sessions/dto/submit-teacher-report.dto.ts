import { IsString } from 'class-validator';

export class SubmitTeacherReportDto {
  @IsString()
  teacher_notes: string;
}
