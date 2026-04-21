import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SupportHubInviteService } from './support-hub-invite.service';
import { BaseApiService } from '../../services/shared/base-api.service';

describe('SupportHubInviteService', () => {
  let service: SupportHubInviteService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', ['get', 'post']);
    TestBed.configureTestingModule({
      providers: [
        SupportHubInviteService,
        { provide: BaseApiService, useValue: api }
      ]
    });
    service = TestBed.inject(SupportHubInviteService);
  });

  it('creates an invite for the given role', () => {
    api.post.and.returnValue(of({}));

    service.createInvite('KatharixAdmin').subscribe();

    expect(api.post).toHaveBeenCalledWith('supporthub/invites', { role: 'KatharixAdmin' });
  });

  it('lists all pending invites', () => {
    api.get.and.returnValue(of([]));

    service.listInvites().subscribe();

    expect(api.get).toHaveBeenCalledWith('supporthub/invites');
  });

  it('validates an invite code by trimming whitespace and url-encoding', () => {
    api.get.and.returnValue(of({}));

    service.validateInvite('  code-123  ').subscribe();

    expect(api.get).toHaveBeenCalledWith('supporthub/invites/validate/code-123');
  });

  it('redeems an invite with the provided code', () => {
    api.post.and.returnValue(of(void 0));

    service.redeemInvite('code-abc').subscribe();

    expect(api.post).toHaveBeenCalledWith('supporthub/invites/redeem', { code: 'code-abc' });
  });
});
