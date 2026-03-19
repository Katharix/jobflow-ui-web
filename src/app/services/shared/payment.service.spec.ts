import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PaymentService } from './payment.service';
import { BaseApiService } from './base-api.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['post']);
    TestBed.configureTestingModule({
      providers: [
        PaymentService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(PaymentService);
  });

  it('creates subscription checkout via checkout endpoint', () => {
    api.post.and.returnValue(of({}));
    service.createSubscriptionCheckout({} as any).subscribe();
    expect(api.post).toHaveBeenCalledWith('payments/checkout', {} as any);
  });

  it('creates invoice checkout session', () => {
    api.post.and.returnValue(of({ url: 'x' }));
    service.createInvoiceCheckoutSession('invoice-1').subscribe();
    expect(api.post).toHaveBeenCalledWith('payments/checkout', { invoiceId: 'invoice-1' });
  });

  it('creates connected account with optional provider', () => {
    api.post.and.returnValue(of({}));
    service.createConnectedAccount('Stripe' as any).subscribe();
    expect(api.post.calls.mostRecent().args[0]).toBe('payments/create-connected-account?provider=Stripe');
  });

  it('links connected account', () => {
    api.post.and.returnValue(of({ linked: true }));
    service.linkConnectedAccount({ accountId: 'acct-1', provider: 'Stripe' as any }).subscribe();
    expect(api.post).toHaveBeenCalledWith('payments/link-connected-account', { accountId: 'acct-1', provider: 'Stripe' as any });
  });
});
