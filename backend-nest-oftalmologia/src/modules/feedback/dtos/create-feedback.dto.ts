import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { FEEDBACK_TYPES } from '../constants/feedback.constants';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MinLength(3)
  @MaxLength(180)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MinLength(5)
  @MaxLength(5000)
  description: string;

  @IsString()
  @IsIn(FEEDBACK_TYPES)
  type: (typeof FEEDBACK_TYPES)[number];
}
