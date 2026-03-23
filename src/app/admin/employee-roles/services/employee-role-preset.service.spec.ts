import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EmployeeRolePresetService } from './employee-role-preset.service';
import { BaseApiService } from '../../../services/shared/base-api.service';

describe('EmployeeRolePresetService', () => {
  let service: EmployeeRolePresetService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [
        EmployeeRolePresetService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(EmployeeRolePresetService);
  });

  it('loads organization presets', () => {
    api.get.and.returnValue(of([]));
    service.getByOrganization().subscribe();
    expect(api.get).toHaveBeenCalledWith('employeerolepresets/organization');
  });

  it('applies a preset with overwrite flag', () => {
    api.post.and.returnValue(of({ created: 1, updated: 0, skipped: 0 }));
    service.applyPreset('preset-1', false).subscribe();
    expect(api.post).toHaveBeenCalledWith('employeerolepresets/preset-1/apply?overwriteExisting=false', {});
  });

  it('deletes a preset', () => {
    api.delete.and.returnValue(of(void 0));
    service.delete('preset-1').subscribe();
    expect(api.delete).toHaveBeenCalledWith('employeerolepresets/preset-1');
  });
});
