import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { SupportHubQueueComponent } from './support-hub-queue.component';
import {
  SupportHubChatApiService,
  SupportChatQueueItemDto,
  SupportChatSessionDto,
} from '../../services/support-hub-chat-api.service';
import { SupportHubSignalRService } from '../../services/support-hub-signalr.service';

describe('SupportHubQueueComponent', () => {
  let fixture: ComponentFixture<SupportHubQueueComponent>;
  let component: SupportHubQueueComponent;
  let chatApi: jasmine.SpyObj<SupportHubChatApiService>;
  let signalR: jasmine.SpyObj<SupportHubSignalRService>;
  let queueUpdated$: Subject<void>;

  const mockQueueItems: SupportChatQueueItemDto[] = [
    {
      sessionId: 'session-1',
      customerName: 'Alice Smith',
      customerEmail: 'alice@example.com',
      queuePosition: 1,
      estimatedWaitSeconds: 180,
      joinedAt: new Date().toISOString(),
    },
  ];

  beforeEach(async () => {
    queueUpdated$ = new Subject<void>();

    chatApi = jasmine.createSpyObj<SupportHubChatApiService>('SupportHubChatApiService', [
      'getQueue',
      'removeFromQueue',
      'pickCustomer',
    ]);
    chatApi.getQueue.and.returnValue(of(mockQueueItems));
    chatApi.removeFromQueue.and.returnValue(of(void 0));
    chatApi.pickCustomer.and.returnValue(of({} as SupportChatSessionDto));

    signalR = jasmine.createSpyObj<SupportHubSignalRService>(
      'SupportHubSignalRService',
      ['startConnection', 'joinRepGroup', 'disconnect'],
      { queueUpdated$: queueUpdated$.asObservable() }
    );
    signalR.startConnection.and.returnValue(Promise.resolve());
    signalR.joinRepGroup.and.returnValue(Promise.resolve());
    signalR.disconnect.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [SupportHubQueueComponent],
      providers: [
        { provide: SupportHubChatApiService, useValue: chatApi },
        { provide: SupportHubSignalRService, useValue: signalR },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SupportHubQueueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable(); // flush initSignalR async Promise chain
  });

  it('loads the queue on initialisation', fakeAsync(() => {
    tick();
    expect(chatApi.getQueue).toHaveBeenCalled();
  }));

  it('onRemove() calls chatApi.removeFromQueue with the given session id', fakeAsync(() => {
    tick();
    chatApi.getQueue.calls.reset();

    component.onRemove('session-1');

    expect(chatApi.removeFromQueue).toHaveBeenCalledWith('session-1');
  }));

  it('onRemove() reloads the queue after the remove completes', fakeAsync(() => {
    tick();
    chatApi.getQueue.calls.reset();

    component.onRemove('session-1');

    expect(chatApi.getQueue).toHaveBeenCalled();
  }));

  it('queueUpdated$ emission triggers loadQueue()', fakeAsync(() => {
    tick(); // flush initSignalR async setup
    chatApi.getQueue.calls.reset();

    queueUpdated$.next();

    expect(chatApi.getQueue).toHaveBeenCalled();
  }));
});
