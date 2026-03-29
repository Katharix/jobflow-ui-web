import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InvoicingSettingsService } from './invoicing-settings.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { InvoicingSettingsUpsertRequestDto } from '../models/invoicing-settings';
import { InvoicingWorkflow } from '../../jobs/models/job';

describe('InvoicingSettingsService', () => {
  let service: InvoicingSettingsService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete', 'getBlob']);

    TestBed.configureTestingModule({
      providers: [
        InvoicingSettingsService,
        { provide: BaseApiService, useValue: api }
      ]
    });

    service = TestBed.inject(InvoicingSettingsService);
  });

  it('fetches invoicing settings from invoicing-settings endpoint', () => {
    api.get.and.returnValue(of({}));

    service.getInvoicingSettings().subscribe();

    expect(api.get).toHaveBeenCalledWith('invoicing-settings');
  });

  it('updates invoicing settings using invoicing-settings endpoint', () => {
    api.put.and.returnValue(of({}));
    const payload: InvoicingSettingsUpsertRequestDto = { defaultWorkflow: InvoicingWorkflow.SendInvoice };

    service.updateInvoicingSettings(payload).subscribe();

    expect(api.put).toHaveBeenCalledWith('invoicing-settings', payload);
  });
});
