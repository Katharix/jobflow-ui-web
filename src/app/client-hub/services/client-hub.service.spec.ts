import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientHubService } from './client-hub.service';
import { BaseApiService } from '../../services/shared/base-api.service';

describe('ClientHubService', () => {
  let service: ClientHubService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [
        ClientHubService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(ClientHubService);
  });

  it('loads client hub profile', () => {
    api.get.and.returnValue(of({} as any));
    service.getMe().subscribe();
    expect(api.get).toHaveBeenCalledWith('client-hub/me');
  });

  it('requests client hub work', () => {
    api.post.and.returnValue(of({} as any));
    service.requestWork({} as any).subscribe();
    expect(api.post).toHaveBeenCalledWith('client-hub/work-requests', {} as any);
  });
});
