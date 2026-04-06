import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { EstimateComponent } from './estimate.component';
import { EstimateService } from '../../../admin/estimates/services/estimate.service';
import { OrganizationBrandingService } from '../../../admin/branding/services/organization-branding.service';
import { Estimate, EstimateStatus } from '../../../admin/estimates/models/estimate';
import { BrandingDto } from '../../../models/organization-branding';

describe('EstimateComponent', () => {
  let component: EstimateComponent;
  let estimateService: jasmine.SpyObj<EstimateService>;
  let brandingService: jasmine.SpyObj<OrganizationBrandingService>;

  const mockEstimate: Estimate = {
    id: 'est-1',
    estimateNumber: 'EST-2001',
    organizationId: 'org-1',
    organizationClientId: 'client-1',
    estimateDate: '2026-05-01',
    total: 450,
    status: EstimateStatus.Sent,
    organizationClient: {
      id: 'client-1',
      firstName: 'John',
      lastName: 'Doe',
      organization: {
        id: 'org-1',
        organizationName: 'Test Org',
      },
    } as Estimate['organizationClient'],
    lineItems: [
      { id: 'li-1', estimateId: 'est-1', description: 'Design', quantity: 5, unitPrice: 50, lineTotal: 250 },
      { id: 'li-2', estimateId: 'est-1', description: 'Build', quantity: 4, unitPrice: 50, lineTotal: 200 },
    ],
  };

  const mockBranding: BrandingDto = {
    organizationId: 'org-1',
    primaryColor: '#ff5722',
    secondaryColor: '#795548',
    businessName: 'Branded Estimates',
    tagline: 'Quality work',
    footerNote: 'Thanks for your business',
    logoUrl: 'https://cdn.example.com/logo.png',
  };

  beforeEach(() => {
    estimateService = jasmine.createSpyObj<EstimateService>('EstimateService', ['getPublic', 'getPublicPdf']);
    brandingService = jasmine.createSpyObj<OrganizationBrandingService>('OrganizationBrandingService', ['getBranding']);

    estimateService.getPublic.and.returnValue(of(mockEstimate));
    brandingService.getBranding.and.returnValue(of(mockBranding));

    TestBed.configureTestingModule({
      providers: [
        { provide: EstimateService, useValue: estimateService },
        { provide: OrganizationBrandingService, useValue: brandingService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (key: string) => key === 'id' ? 'token-abc' : null },
            },
          },
        },
      ],
    });

    component = TestBed.runInInjectionContext(() => new EstimateComponent());
  });

  it('loads estimate and branding on init', () => {
    component.ngOnInit();

    expect(estimateService.getPublic).toHaveBeenCalledWith('token-abc');
    expect(brandingService.getBranding).toHaveBeenCalledWith('org-1');
    expect(component.estimate).toEqual(mockEstimate);
    expect(component.branding).toEqual(mockBranding);
  });

  it('sets error when route has no id', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: EstimateService, useValue: estimateService },
        { provide: OrganizationBrandingService, useValue: brandingService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } },
        },
      ],
    });
    const comp = TestBed.runInInjectionContext(() => new EstimateComponent());
    comp.ngOnInit();

    expect(comp.error).toBe('Invalid estimate link.');
    expect(estimateService.getPublic).not.toHaveBeenCalled();
  });

  it('sets error when estimate fetch fails', () => {
    estimateService.getPublic.and.returnValue(throwError(() => new Error('not found')));
    component.ngOnInit();

    expect(component.error).toBe('Unable to load this estimate. It may be expired or invalid.');
    expect(component.loading).toBeFalse();
  });

  it('returns branded primary color', () => {
    component.branding = mockBranding;
    expect(component.brandPrimary).toBe('#ff5722');
  });

  it('returns default primary color when no branding', () => {
    component.branding = undefined;
    expect(component.brandPrimary).toBe('#0d6efd');
  });

  it('returns branded secondary color', () => {
    component.branding = mockBranding;
    expect(component.brandSecondary).toBe('#795548');
  });

  it('returns branded business name', () => {
    component.branding = mockBranding;
    expect(component.brandBusinessName).toBe('Branded Estimates');
  });

  it('falls back to org name when no branding business name', () => {
    component.estimate = mockEstimate;
    component.branding = { organizationId: 'org-1' };
    expect(component.brandBusinessName).toBe('Test Org');
  });

  it('returns branded footer note', () => {
    component.branding = mockBranding;
    expect(component.brandFooter).toBe('Thanks for your business');
  });

  it('returns empty footer when no branding', () => {
    component.branding = undefined;
    expect(component.brandFooter).toBe('');
  });

  it('computes subtotal from line items', () => {
    component.estimate = mockEstimate;
    expect(component.subtotal).toBe(450);
  });

  it('computes status label for enum value', () => {
    component.estimate = { ...mockEstimate, status: EstimateStatus.Accepted };
    expect(component.statusLabel).toBe('Accepted');
  });

  it('computes status label for string value', () => {
    component.estimate = { ...mockEstimate, status: 'Custom Status' };
    expect(component.statusLabel).toBe('Custom Status');
  });

  it('returns client name', () => {
    component.estimate = mockEstimate;
    expect(component.clientName).toBe('John Doe');
  });

  it('returns organization name', () => {
    component.estimate = mockEstimate;
    expect(component.organizationName).toBe('Test Org');
  });

  it('returns display date from estimateDate', () => {
    component.estimate = mockEstimate;
    expect(component.displayDate).toBe('2026-05-01');
  });

  it('returns line items', () => {
    component.estimate = mockEstimate;
    expect(component.lineItems.length).toBe(2);
  });

  it('gracefully handles branding fetch failure', () => {
    brandingService.getBranding.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();

    expect(component.branding).toBeUndefined();
    expect(component.brandPrimary).toBe('#0d6efd');
  });
});
