import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InvoiceService } from './invoice.service';
import { BaseApiService } from '../../../services/shared/base-api.service';

describe('InvoiceService', () => {
  let service: InvoiceService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete', 'getBlob']);
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

  it('loads paged invoices with default page size', () => {
    api.get.and.returnValue(of({ items: [], nextCursor: null }));

    service.getByOrganizationPaged().subscribe();

    const args = api.get.calls.mostRecent().args;
    expect(args[0]).toBe('invoice/organization');
    expect(args[1]).toEqual(jasmine.objectContaining({ pageSize: '50' }));
  });

  it('passes all optional paged query params when provided', () => {
    api.get.and.returnValue(of({ items: [] }));

    service.getByOrganizationPaged({
      cursor: 'cur-1',
      pageSize: 25,
      status: 'sent',
      search: 'acme',
      sortBy: 'createdAt',
      sortDirection: 'desc'
    }).subscribe();

    const params = api.get.calls.mostRecent().args[1];
    expect(params).toEqual(jasmine.objectContaining({
      cursor: 'cur-1',
      pageSize: '25',
      status: 'sent',
      search: 'acme',
      sortBy: 'createdAt',
      sortDirection: 'desc'
    }));
  });

  it('loads invoices by client id', () => {
    api.get.and.returnValue(of([]));

    service.getByClient('client-1').subscribe();

    expect(api.get).toHaveBeenCalledWith('invoice/client/client-1');
  });

  it('loads a single invoice by id', () => {
    api.get.and.returnValue(of({}));

    service.getInvoice('invoice-1').subscribe();

    expect(api.get).toHaveBeenCalledWith('invoice/invoice-1');
  });

  it('creates an invoice for an organization', () => {
    const request = { clientId: 'client-1', lineItems: [] };
    api.post.and.returnValue(of({}));

    service.create('org-1', request as never).subscribe();

    expect(api.post).toHaveBeenCalledWith('invoice/org-1', request);
  });

  it('upserts invoice for organization via organization endpoint', () => {
    const request = { clientId: 'client-1', lineItems: [] };
    api.post.and.returnValue(of({}));

    service.upsertForOrganization(request as never).subscribe();

    expect(api.post).toHaveBeenCalledWith('invoice/organization', request);
  });

  it('updates an invoice by id', () => {
    const request = { status: 'sent' };
    api.put.and.returnValue(of({}));

    service.updateInvoice('invoice-1', request as never).subscribe();

    expect(api.put).toHaveBeenCalledWith('invoice/invoice-1', request);
  });

  it('sends an invoice via the send endpoint', () => {
    api.post.and.returnValue(of(void 0));

    service.sendInvoice('invoice-1').subscribe();

    expect(api.post).toHaveBeenCalledWith('invoice/invoice-1/send', {});
  });

  it('sends a payment reminder via the remind endpoint', () => {
    api.post.and.returnValue(of(void 0));

    service.sendReminder('invoice-1').subscribe();

    expect(api.post).toHaveBeenCalledWith('invoice/invoice-1/remind', {});
  });

  it('deletes an invoice by id', () => {
    api.delete.and.returnValue(of(void 0));

    service.deleteInvoice('invoice-1').subscribe();

    expect(api.delete).toHaveBeenCalledWith('invoice/invoice-1');
  });

  it('fetches organization invoice summary', () => {
    api.get.and.returnValue(of({}));

    service.getSummary().subscribe();

    expect(api.get).toHaveBeenCalledWith('invoice/organization/summary');
  });
});