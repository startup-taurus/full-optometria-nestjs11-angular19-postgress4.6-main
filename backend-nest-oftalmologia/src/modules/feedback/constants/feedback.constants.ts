export const FEEDBACK_TYPES = ['suggestion', 'report'] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_STATUSES = ['nuevo', 'en_revision', 'resuelto'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
