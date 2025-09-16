import { IsString } from 'class-validator';

export class SubmitStudentGoalDto {
  @IsString()
  student_goal: string;
}
