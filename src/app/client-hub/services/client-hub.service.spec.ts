import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientHubService } from './client-hub.service';
import { BaseApiService } from '../../services/shared/base-api.service';
import { ClientHubAuthService } from './client-hub-auth.service';

describe('ClientHubService', () => {
  let service: ClientHubService;
  let api: jasmine.SpyObj<BaseApiService>;
  let auth: jasmine.SpyObj<ClientHubAuthService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', [
      'get',
      'post',
      'put',
      'getWithHeaders',
      'postWithHeaders',
      'putWithHeaders'
    ]);
    auth = jasmine.createSpyObj<ClientHubAuthService>('ClientHubAuthService', ['getToken']);
    auth.getToken.and.returnValue('test.jwt.token');
    TestBed.configureTestingModule({
      providers: [
        ClientHubService,
        { provide: BaseApiService, useValue: api },
        { provide: ClientHubAuthService, useValue: auth }
      ]
    });
    service = TestBed.inject(ClientHubService);
  });

  it('loads client hub profile', () => {
    api.getWithHeaders.and.returnValue(of({} as any));
    service.getMe().subscribe();
    expect(api.getWithHeaders).toHaveBeenCalledWith('client-hub/me', jasmine.anything());
  });

  it('requests client hub work', () => {
    api.postWithHeaders.and.returnValue(of({} as any));
    service.requestWork({} as any).subscribe();
    expect(api.postWithHeaders).toHaveBeenCalledWith('client-hub/work-requests', {} as any, jasmine.anything());
  });
});
