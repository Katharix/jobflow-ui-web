import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UserProfileService } from './user-profile.service';
import { BaseApiService } from './base-api.service';
import { UserProfileUpdateRequest } from '../../models/user-profile';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'put']);
    TestBed.configureTestingModule({
      providers: [
        UserProfileService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(UserProfileService);
  });

  it('fetches the current user profile from users/me', () => {
    const profile = { id: 'u-1', firstName: 'Jane' as string | null, lastName: 'Doe' as string | null, email: 'jane@test.com' as string | null, phoneNumber: null, preferredLanguage: 'en' as string | null };
    api.get.and.returnValue(of(profile));

    let result: typeof profile | undefined;
    service.getMe().subscribe(r => (result = r as typeof profile));

    expect(api.get).toHaveBeenCalledWith('users/me', undefined, undefined);
    expect(result).toEqual(profile);
  });

  it('fetches profile passing through HttpContext when provided', () => {
    api.get.and.returnValue(of({}));
    const context = {} as import('@angular/common/http').HttpContext;

    service.getMe({ context }).subscribe();

    expect(api.get).toHaveBeenCalledWith('users/me', undefined, context);
  });

  it('updates the current user profile via put to users/me', () => {
    const request: UserProfileUpdateRequest = { firstName: 'Updated', preferredLanguage: 'es' };
    api.put.and.returnValue(of({ id: 'u-1', firstName: 'Updated' }));

    service.updateMe(request).subscribe();

    expect(api.put).toHaveBeenCalledWith('users/me', request);
  });
});
