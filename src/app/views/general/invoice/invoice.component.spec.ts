import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { InvoiceComponent } from './invoice.component';
import { InvoiceService } from '../../../admin/invoices/services/invoice.service';
import { OrganizationBrandingService } from '../../../admin/branding/services/organization-branding.service';
import { PaymentService } from '../../../services/shared/payment.service';
import { Invoice, InvoiceStatus } from '../../../models/invoice';
import { BrandingDto } from '../../../models/organization-branding';

describe('InvoiceComponent', () => {
  let component: InvoiceComponent;
  let invoiceService: jasmine.SpyObj<InvoiceService>;
  let brandingService: jasmine.SpyObj<OrganizationBrandingService>;
  let paymentService: jasmine.SpyObj<PaymentService>;

  const mockInvoice: Invoice = {
    id: 'inv-1',
    invoiceNumber: 'INV-1001',
    organizationId: 'org-1',
    organizationClientId: 'client-1',
    invoiceDate: '2026-04-01',
    dueDate: '2026-04-15',
    totalAmount: 299,
    amountPaid: 0,
    balanceDue: 299,
    status: InvoiceStatus.Sent,
    organizationClient: {
      id: 'client-1',
      firstName: 'Jane',
      lastName: 'Cooper',
      organization: {
        organizationName: 'Acme Corp',
        defaultTaxRate: 0.08
      }
    } as Invoice['organizationClient'],
    lineItems: [
      { description: 'Service A', quantity: 2, unitPrice: 100, lineTotal: 200 },
      { description: 'Service B', quantity: 1, unitPrice: 99, lineTotal: 99 }
    ]
  } as Invoice;

  const mockBranding: BrandingDto = {
    organizationId: 'org-1',
    primaryColor: '#e91e63',
    secondaryColor: '#607d8b',
    businessName: 'Branded Biz',
    tagline: 'We are branded',
    footerNote: 'Thank you for choosing us',
    logoUrl: 'https://cdn.example.com/logo.png'
  };

  beforeEach(() => {
    invoiceService = jasmine.createSpyObj<InvoiceService>('InvoiceService', ['getInvoice']);
    brandingService = jasmine.createSpyObj<OrganizationBrandingService>('OrganizationBrandingService', ['getBranding']);
    paymentService = jasmine.createSpyObj<PaymentService>('PaymentService', ['createInvoicePaymentIntent']);

    invoiceService.getInvoice.and.returnValue(of(mockInvoice));
    brandingService.getBranding.and.returnValue(of(mockBranding));

    TestBed.configureTestingModule({
      providers: [
        { provide: InvoiceService, useValue: invoiceService },
        { provide: OrganizationBrandingService, useValue: brandingService },
        { provide: PaymentService, useValue: paymentService },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => key === 'id' ? 'inv-1' : null },
              queryParamMap: { get: () => null }
            }
          }
        }
      ]
    });

    component = TestBed.runInInjectionContext(() => new InvoiceComponent());
  });

  it('loads invoice and branding on init', () => {
    component.ngOnInit();

    expect(invoiceService.getInvoice).toHaveBeenCalledWith('inv-1');
    expect(brandingService.getBranding).toHaveBeenCalledWith('org-1');
    expect(component.invoice).toEqual(mockInvoice);
    expect(component.branding).toEqual(mockBranding);
  });

  it('returns branded primary color', () => {
    component.branding = mockBranding;
    expect(component.brandPrimary).toBe('#e91e63');
  });

  it('returns default primary color when no branding', () => {
    component.branding = undefined;
    expect(component.brandPrimary).toBe('#0d6efd');
  });

  it('returns branded secondary color', () => {
    component.branding = mockBranding;
    expect(component.brandSecondary).toBe('#607d8b');
  });

  it('returns branded business name', () => {
    component.branding = mockBranding;
    expect(component.brandBusinessName).toBe('Branded Biz');
  });

  it('falls back to org name when branding has no business name', () => {
    component.invoice = mockInvoice;
    component.branding = { organizationId: 'org-1' };
    expect(component.brandBusinessName).toBe('Acme Corp');
  });

  it('returns branded footer note', () => {
    component.branding = mockBranding;
    expect(component.brandFooter).toBe('Thank you for choosing us');
  });

  it('returns empty footer when no branding', () => {
    component.branding = undefined;
    expect(component.brandFooter).toBe('');
  });

  it('computes subtotal from line items', () => {
    component.invoice = mockInvoice;
    expect(component.subTotal).toBe(299);
  });

  it('computes tax amount', () => {
    component.invoice = mockInvoice;
    expect(component.taxAmount).toBeCloseTo(23.92, 2);
  });

  it('computes balance due', () => {
    component.invoice = mockInvoice;
    expect(component.balanceDue).toBeCloseTo(322.92, 2);
  });

  it('gracefully handles branding fetch failure', () => {
    brandingService.getBranding.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();

    expect(component.branding).toBeUndefined();
    expect(component.brandPrimary).toBe('#0d6efd');
  });

  it('defaults payment provider label to Stripe', () => {
    component.invoice = mockInvoice;
    expect(component.paymentProviderLabel).toBe('Stripe');
  });
});
