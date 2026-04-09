import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrganizationBrandingService } from './organization-branding.service';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { BrandingDto } from '../../../models/organization-branding';

describe('OrganizationBrandingService', () => {
  let service: OrganizationBrandingService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        OrganizationBrandingService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(OrganizationBrandingService);
  });

  it('fetches branding by organization id', () => {
    const branding: BrandingDto = {
      organizationId: 'org-1',
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      businessName: 'Test Co'
    };
    api.get.and.returnValue(of(branding));

    service.getBranding('org-1').subscribe(result => {
      expect(result).toEqual(branding);
    });

    expect(api.get).toHaveBeenCalledWith('organizationbranding/org-1');
  });

  it('creates or updates branding', () => {
    const payload: BrandingDto = {
      organizationId: 'org-1',
      primaryColor: '#0000ff',
      businessName: 'Updated Co',
      tagline: 'We build things'
    };
    api.post.and.returnValue(of(payload));

    service.createOrUpdateBranding(payload).subscribe(result => {
      expect(result).toEqual(payload);
    });

    expect(api.post).toHaveBeenCalledWith('organizationbranding', payload);
  });
});
