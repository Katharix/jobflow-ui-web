import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EmployeeRoleService } from './employee-role.service';
import { BaseApiService } from '../../../services/shared/base-api.service';

describe('EmployeeRoleService', () => {
  let service: EmployeeRoleService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [
        EmployeeRoleService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(EmployeeRoleService);
  });

  it('loads org roles', () => {
    api.get.and.returnValue(of([]));
    service.getByOrganization().subscribe();
    expect(api.get).toHaveBeenCalledWith('employeeroles/organization');
  });

  it('deletes role', () => {
    api.delete.and.returnValue(of(void 0));
    service.delete('role-1').subscribe();
    expect(api.delete).toHaveBeenCalledWith('employeeroles/role-1');
  });
});
