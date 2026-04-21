import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { SupportHubQueueStatusComponent } from './support-hub-queue-status.component';
import { SupportHubSignalRService, SupportChatAgentJoinedEvent } from '../../services/support-hub-signalr.service';
import { SupportHubChatApiService, SupportChatSessionDto } from '../../services/support-hub-chat-api.service';

const SESSION_ID = 'test-session-abc';

describe('SupportHubQueueStatusComponent', () => {
  let fixture: ComponentFixture<SupportHubQueueStatusComponent>;
  let router: jasmine.SpyObj<Router>;
  let signalR: jasmine.SpyObj<SupportHubSignalRService>;
  let chatApi: jasmine.SpyObj<SupportHubChatApiService>;
  let agentJoined$: Subject<SupportChatAgentJoinedEvent>;
  let queueUpdated$: Subject<void>;

  beforeEach(async () => {
    agentJoined$ = new Subject<SupportChatAgentJoinedEvent>();
    queueUpdated$ = new Subject<void>();

    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    chatApi = jasmine.createSpyObj<SupportHubChatApiService>('SupportHubChatApiService', [
      'getSession',
    ]);
    chatApi.getSession.and.returnValue(
      of({ queuePosition: 1, estimatedWaitSeconds: 120 } as SupportChatSessionDto)
    );

    signalR = jasmine.createSpyObj<SupportHubSignalRService>(
      'SupportHubSignalRService',
      ['startConnection', 'joinSession', 'leaveSession'],
      {
        agentJoined$: agentJoined$.asObservable(),
        queueUpdated$: queueUpdated$.asObservable(),
      }
    );
    signalR.startConnection.and.returnValue(Promise.resolve());
    signalR.joinSession.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [SupportHubQueueStatusComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: SupportHubChatApiService, useValue: chatApi },
        { provide: SupportHubSignalRService, useValue: signalR },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => SESSION_ID } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubQueueStatusComponent);
  });

  afterEach(() => {
    sessionStorage.removeItem('support-hub-session-id');
  });

  it('navigates to /admin/support-chat/chat/:id when sessionStorage matches sessionId', fakeAsync(() => {
    sessionStorage.setItem('support-hub-session-id', SESSION_ID);
    fixture.detectChanges();
    tick(); // flush startConnection + joinSession promises

    agentJoined$.next({ agentName: 'Support Rep' });
    tick(2000); // flush setTimeout

    expect(router.navigate).toHaveBeenCalledWith(
      ['/admin/support-chat/chat', SESSION_ID],
      { replaceUrl: true }
    );
  }));

  it('navigates to /support-hub/chat/:id when sessionStorage does not match', fakeAsync(() => {
    sessionStorage.setItem('support-hub-session-id', 'different-session');
    fixture.detectChanges();
    tick();

    agentJoined$.next({ agentName: 'Support Rep' });
    tick(2000);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/support-hub/chat', SESSION_ID],
      { replaceUrl: true }
    );
  }));

  it('navigates to /support-hub/chat/:id when sessionStorage key is absent', fakeAsync(() => {
    sessionStorage.removeItem('support-hub-session-id');
    fixture.detectChanges();
    tick();

    agentJoined$.next({ agentName: 'Support Rep' });
    tick(2000);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/support-hub/chat', SESSION_ID],
      { replaceUrl: true }
    );
  }));
});
