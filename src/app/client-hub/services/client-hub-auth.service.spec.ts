import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientHubAuthService } from './client-hub-auth.service';
import { BaseApiService } from '../../services/shared/base-api.service';

describe('ClientHubAuthService', () => {
  let service: ClientHubAuthService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['post']);
    TestBed.configureTestingModule({
      providers: [
        ClientHubAuthService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(ClientHubAuthService);
    localStorage.clear();
  });

  it('requests magic link without auth', () => {
    api.post.and.returnValue(of({}));
    service.requestMagicLink('test@example.com').subscribe();
    expect(api.post).toHaveBeenCalledWith(
      'client-hub-auth/magic-link/request',
      { emailAddress: 'test@example.com', organizationClientId: null },
      false
    );
  });

  it('redeems magic link and returns access token', () => {
    const token = buildJwtToken(Math.floor(Date.now() / 1000) + 3600);
    api.post.and.returnValue(of({ accessToken: token }));

    service.redeemMagicLink('token-1').subscribe((result) => {
      expect(result).toBe(token);
    });
  });

  it('detects valid JWT shape', () => {
    expect(service.isLikelyJwt('a.b.c')).toBeTrue();
    expect(service.isLikelyJwt('a.b')).toBeFalse();
  });

  it('clears expired token on getToken', () => {
    const expired = buildJwtToken(Math.floor(Date.now() / 1000) - 10);
    service.setToken(expired);
    expect(service.getToken()).toBeNull();
  });
});

function buildJwtToken(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const payload = btoa(JSON.stringify({ exp }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${payload}.signature`;
}