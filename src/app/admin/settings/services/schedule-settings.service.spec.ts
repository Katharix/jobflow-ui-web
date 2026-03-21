import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ScheduleSettingsService } from './schedule-settings.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { ScheduleSettingsDto } from '../models/schedule-settings';

describe('ScheduleSettingsService', () => {
  let service: ScheduleSettingsService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete', 'getBlob']);
    TestBed.configureTestingModule({
      providers: [
        ScheduleSettingsService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(ScheduleSettingsService);
  });

  it('fetches schedule settings from API', () => {
    api.get.and.returnValue(of({} as ScheduleSettingsDto));

    service.getScheduleSettings().subscribe();

    expect(api.get).toHaveBeenCalledWith('schedule-settings');
  });

  it('updates schedule settings using API', () => {
    api.put.and.returnValue(of({} as ScheduleSettingsDto));

    const payload = {
      travelBufferMinutes: 15,
      defaultWindowMinutes: 90,
      enforceTravelBuffer: true,
      autoNotifyReschedule: true
    };

    service.updateScheduleSettings(payload).subscribe();

    expect(api.put).toHaveBeenCalledWith('schedule-settings', payload);
  });
});
