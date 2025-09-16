import { IsString, IsOptional } from 'class-validator';

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  meeting_url?: string;

  @IsOptional()
  @IsString()
  meeting_passcode?: string;
}
