import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { WorkflowSettingsService } from './workflow-settings.service';
import { BaseApiService } from '../../../services/shared/base-api.service';

describe('WorkflowSettingsService', () => {
  let service: WorkflowSettingsService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete', 'getBlob']);
    TestBed.configureTestingModule({
      providers: [
        WorkflowSettingsService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(WorkflowSettingsService);
  });

  it('fetches job statuses from workflow settings endpoint', () => {
    api.get.and.returnValue(of([]));

    service.getJobStatuses().subscribe();

    expect(api.get).toHaveBeenCalledWith('workflow-settings/job-statuses');
  });

  it('updates job statuses using workflow settings endpoint', () => {
    api.put.and.returnValue(of([]));

    service.updateJobStatuses([]).subscribe();

    expect(api.put).toHaveBeenCalledWith('workflow-settings/job-statuses', []);
  });
});
