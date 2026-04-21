import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SupportHubChatApiService } from './support-hub-chat-api.service';
import { BaseApiService } from '../../services/shared/base-api.service';

describe('SupportHubChatApiService', () => {
  let service: SupportHubChatApiService;
  let api: jasmine.SpyObj<BaseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<BaseApiService>('BaseApiService', [
      'get',
      'post',
      'delete',
    ]);

    TestBed.configureTestingModule({
      providers: [
        SupportHubChatApiService,
        { provide: BaseApiService, useValue: api },
      ],
    });
    service = TestBed.inject(SupportHubChatApiService);
  });

  it('removeFromQueue sends DELETE to the correct URL', () => {
    api.delete.and.returnValue(of(void 0));
    const sessionId = 'abc-session-123';

    service.removeFromQueue(sessionId).subscribe();

    expect(api.delete).toHaveBeenCalledWith(
      `supporthub/chat/sessions/${sessionId}/queue`
    );
  });

  it('removeFromQueue returns the observable from the API', () => {
    api.delete.and.returnValue(of(void 0));
    let completed = false;

    service.removeFromQueue('some-id').subscribe({ complete: () => (completed = true) });

    expect(completed).toBeTrue();
  });
});
