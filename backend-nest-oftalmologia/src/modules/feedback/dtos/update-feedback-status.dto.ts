import { IsIn, IsString } from 'class-validator';
import { FEEDBACK_STATUSES } from '../constants/feedback.constants';

export class UpdateFeedbackStatusDto {
  @IsString()
  @IsIn(FEEDBACK_STATUSES)
  status: (typeof FEEDBACK_STATUSES)[number];
}
