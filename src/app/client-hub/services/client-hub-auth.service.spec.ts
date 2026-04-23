import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ClientHubAuthService } from './client-hub-auth.service';
import { BaseApiService } from '../../services/shared/base-api.service';
import { of } from 'rxjs';

describe('ClientHubAuthService', () => {
  let service: ClientHubAuthService;
  let api: jasmine.SpyObj<BaseApiService>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['post']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ClientHubAuthService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(ClientHubAuthService);
    httpMock = TestBed.inject(HttpTestingController);
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests magic link without auth', () => {
    api.post.and.returnValue(of({}));
    service.requestMagicLink('test@example.com').subscribe();
    expect(api.post).toHaveBeenCalledWith(
      'client-hub-auth/magic-link/request',
      { emailAddress: 'test@example.com', organizationClientId: null }
    );
  });

  it('redeems magic link and returns expiresAt', () => {
    const expiresAt = '2099-01-01T00:00:00Z';
    service.redeemMagicLink('token-1').subscribe((result) => {
      expect(result).toBe(expiresAt);
    });

    const req = httpMock.expectOne((r) => r.url.includes('client-portal/redeem'));
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ expiresAt });
  });

  it('markAuthenticated stores expiry and hasToken returns true', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString();
    service.markAuthenticated(future);
    expect(service.hasToken()).toBeTrue();
  });

  it('hasToken returns false after expiry', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    service.markAuthenticated(past);
    expect(service.hasToken()).toBeFalse();
  });

  it('hasToken returns false when no session is stored', () => {
    expect(service.hasToken()).toBeFalse();
  });
});
