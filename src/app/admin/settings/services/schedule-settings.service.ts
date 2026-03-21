import { Injectable, inject } from '@angular/core';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { ScheduleSettingsDto, ScheduleSettingsUpsertRequestDto } from '../models/schedule-settings';

@Injectable({ providedIn: 'root' })
export class ScheduleSettingsService {
  private api = inject(BaseApiService);


  getScheduleSettings() {
    return this.api.get<ScheduleSettingsDto>('schedule-settings');
  }

  updateScheduleSettings(dto: ScheduleSettingsUpsertRequestDto) {
    return this.api.put<ScheduleSettingsDto>('schedule-settings', dto);
  }
}
