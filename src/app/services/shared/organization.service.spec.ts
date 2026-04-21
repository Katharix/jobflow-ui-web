import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrganizationService } from './organization.service';
import { BaseApiService } from './base-api.service';
import { OrganizationDto } from '../../models/organization';

describe('OrganizationService', () => {
  let service: OrganizationService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [
        OrganizationService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(OrganizationService);
  });

  it('gets all organizations from the all endpoint', () => {
    api.get.and.returnValue(of([]));

    service.getAllOrganizations().subscribe();

    expect(api.get).toHaveBeenCalledWith('organizations/all');
  });

  it('registers an organization via the register endpoint', () => {
    const dto: OrganizationDto = { organizationName: 'Acme', email: 'acme@test.com' };
    api.post.and.returnValue(of({ id: 'org-1' }));

    service.registerOrganization(dto).subscribe();

    expect(api.post).toHaveBeenCalledWith('organizations/register', dto);
  });

  it('creates an organization via the create endpoint', () => {
    const dto: OrganizationDto = { organizationName: 'NewOrg' };
    api.post.and.returnValue(of({ id: 'org-2' }));

    service.createOrganization(dto).subscribe();

    expect(api.post).toHaveBeenCalledWith('organizations/create', dto);
  });

  it('retrieves an organization by id via the retrieve endpoint', () => {
    const request = { organizationId: 'org-1' };
    api.post.and.returnValue(of({ id: 'org-1' }));

    service.getOrganizationById(request).subscribe();

    expect(api.post).toHaveBeenCalledWith('organizations/retrieve', request);
  });

  it('updates organization via the update endpoint', () => {
    const request: Partial<OrganizationDto> = { organizationName: 'Updated' };
    api.put.and.returnValue(of({ id: 'org-1', organizationName: 'Updated' }));

    service.updateOrganization(request).subscribe();

    expect(api.put).toHaveBeenCalledWith('organizations/update', request);
  });

  it('updates industry key via the industry endpoint', () => {
    api.put.and.returnValue(of({}));

    service.updateIndustry('landscaping').subscribe();

    expect(api.put).toHaveBeenCalledWith('organizations/industry', { industryKey: 'landscaping' });
  });

  it('passes null industry key when clearing industry', () => {
    api.put.and.returnValue(of({}));

    service.updateIndustry(null).subscribe();

    expect(api.put).toHaveBeenCalledWith('organizations/industry', { industryKey: null });
  });
});
