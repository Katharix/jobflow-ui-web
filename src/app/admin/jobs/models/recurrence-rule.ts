export type RecurrencePattern = 'Weekly' | 'Monthly';
export type RecurrenceEndType = 'Never' | 'OnDate' | 'AfterCount';

export interface RecurrenceRuleUpsertRequest {
  pattern: RecurrencePattern;
  interval: number;
  dayOfWeek?: number[]; // 0-6
  dayOfMonth?: number; // 1-31
  startDate: Date;
  endType: RecurrenceEndType;
  endDate?: Date;
  occurrenceCount?: number;
}