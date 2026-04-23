import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ClientHubService } from './client-hub.service';
import { BaseApiService } from '../../services/shared/base-api.service';
import { ClientHubProfile, ClientHubWorkRequest, ClientHubWorkRequestResponse } from '../models/client-hub.models';

describe('ClientHubService', () => {
  let service: ClientHubService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', [
      'get',
      'post',
      'put',
      'postFormWithHeaders',
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ClientHubService,
        { provide: BaseApiService, useValue: api },
      ]
    });
    service = TestBed.inject(ClientHubService);
  });

  it('loads client hub profile', () => {
    api.get.and.returnValue(of({} as ClientHubProfile));
    service.getMe().subscribe();
    expect(api.get).toHaveBeenCalledWith('client-hub/me');
  });

  it('requests client hub work', () => {
    api.post.and.returnValue(of({} as ClientHubWorkRequestResponse));
    const request: ClientHubWorkRequest = { subject: 'New work request', details: 'Need help' };
    service.requestWork(request).subscribe();
    expect(api.post).toHaveBeenCalledWith('client-hub/work-requests', request);
  });
});
