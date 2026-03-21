export interface ScheduleSettingsDto {
  travelBufferMinutes: number;
  defaultWindowMinutes: number;
  enforceTravelBuffer: boolean;
  autoNotifyReschedule: boolean;
}

export type ScheduleSettingsUpsertRequestDto = ScheduleSettingsDto;
