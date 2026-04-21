import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrganizationTypeService } from './organization-type.service';
import { BaseApiService } from './base-api.service';

describe('OrganizationTypeService', () => {
  let service: OrganizationTypeService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get']);
    TestBed.configureTestingModule({
      providers: [
        OrganizationTypeService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(OrganizationTypeService);
  });

  it('fetches all organization types from organization/types/all', () => {
    const types = [{ id: 'type-1', typeName: 'Landscaping' }];
    api.get.and.returnValue(of(types));

    let result: typeof types | undefined;
    service.getAllOrganizations().subscribe(r => (result = r));

    expect(api.get).toHaveBeenCalledWith('organization/types/all');
    expect(result).toEqual(types);
  });
});
