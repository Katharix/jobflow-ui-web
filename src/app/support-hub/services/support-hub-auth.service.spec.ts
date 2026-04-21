import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SupportHubAuthService } from './support-hub-auth.service';
import { BaseApiService } from '../../services/shared/base-api.service';

describe('SupportHubAuthService', () => {
  let service: SupportHubAuthService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['post']);
    TestBed.configureTestingModule({
      providers: [
        SupportHubAuthService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(SupportHubAuthService);
  });

  it('registers the current user via supporthub/register', () => {
    api.post.and.returnValue(of(void 0));

    service.register().subscribe();

    expect(api.post).toHaveBeenCalledWith('supporthub/register', {});
  });
});
