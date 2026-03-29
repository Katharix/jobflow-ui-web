import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InvoiceService } from './invoice.service';
import { BaseApiService } from '../../../services/shared/base-api.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'delete', 'getBlob']);
    TestBed.configureTestingModule({
      providers: [
        InvoiceService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(InvoiceService);
  });

  it('loads organization invoices', () => {
    api.get.and.returnValue(of([]));
    service.getByOrganization().subscribe();
    expect(api.get).toHaveBeenCalledWith('invoice/organization');
  });

  it('loads invoice pdf', () => {
    api.getBlob.and.returnValue(of(new Blob()));
    service.getPdf('invoice-1').subscribe();
    expect(api.getBlob).toHaveBeenCalledWith('invoice/invoice-1/pdf');
  });
});