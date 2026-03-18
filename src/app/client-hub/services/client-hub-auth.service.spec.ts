import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BaseApiService } from '../../services/shared/base-api.service';
import { ClientHubAuthService } from './client-hub-auth.service';

describe('ClientHubAuthService', () => {
  let service: ClientHubAuthService;
  let apiSpy: jasmine.SpyObj<BaseApiService>;

  const jwtToken = 'header.payload.signature';

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('BaseApiService', ['get', 'post', 'put', 'delete', 'getBlob']);

    TestBed.configureTestingModule({
      providers: [
        ClientHubAuthService,
        { provide: BaseApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(ClientHubAuthService);
  });

  it('should redeem magic link and read a root accessToken', (done) => {
    apiSpy.post.and.returnValue(of({ accessToken: jwtToken }));

    service.redeemMagicLink('magic-token').subscribe({
      next: (token) => {
        expect(token).toBe(jwtToken);
        expect(apiSpy.post).toHaveBeenCalledWith('client-portal/redeem', { token: 'magic-token' }, false);
        done();
      },
      error: done.fail,
    });
  });

  it('should redeem magic link and read a nested jwt token', (done) => {
    apiSpy.post.and.returnValue(of({ result: { jwt: jwtToken } }));

    service.redeemMagicLink('magic-token').subscribe({
      next: (token) => {
        expect(token).toBe(jwtToken);
        done();
      },
      error: done.fail,
    });
  });

  it('should error when redeem response has no JWT token', (done) => {
    apiSpy.post.and.returnValue(of({ value: { id: 'client-1' } }));

    service.redeemMagicLink('magic-token').subscribe({
      next: () => done.fail('Expected redeemMagicLink to fail when no JWT token is returned.'),
      error: (error: Error) => {
        expect(error.message).toContain('No access token was returned after redeeming the magic link.');
        done();
      },
    });
  });
});
