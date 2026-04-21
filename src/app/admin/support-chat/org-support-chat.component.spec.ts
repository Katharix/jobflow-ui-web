import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrgSupportChatComponent } from './org-support-chat.component';
import { AuthService } from '../../auth/services/auth.service';
import { SupportHubChatApiService } from '../../support-hub/services/support-hub-chat-api.service';

describe('OrgSupportChatComponent', () => {
  let fixture: ComponentFixture<OrgSupportChatComponent>;
  let component: OrgSupportChatComponent;
  let chatApi: jasmine.SpyObj<SupportHubChatApiService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser = { displayName: 'Jane Doe', email: 'jane@example.com' };

  beforeEach(async () => {
    chatApi = jasmine.createSpyObj<SupportHubChatApiService>('SupportHubChatApiService', [
      'joinQueue',
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [OrgSupportChatComponent],
      providers: [
        { provide: SupportHubChatApiService, useValue: chatApi },
        { provide: AuthService, useValue: { currentUser: mockUser } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrgSupportChatComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    sessionStorage.removeItem('support-hub-session-id');
    sessionStorage.removeItem('support-hub-customer-name');
  });

  it('navigates to queue-status and stores sessionId on success', () => {
    chatApi.joinQueue.and.returnValue(
      of({ sessionId: 'sess-xyz', queuePosition: 1, estimatedWaitSeconds: 60 })
    );

    fixture.detectChanges(); // triggers ngOnInit -> startChat()

    expect(router.navigate).toHaveBeenCalledWith([
      '/admin/support-chat/queue-status',
      'sess-xyz',
    ]);
    expect(sessionStorage.getItem('support-hub-session-id')).toBe('sess-xyz');
  });

  it('sets error from error.error.error when queue is full (400)', () => {
    chatApi.joinQueue.and.returnValue(
      throwError(() => ({ error: { error: 'Queue is full. Please try again later.' } }))
    );

    fixture.detectChanges();

    expect(component.error).toBe('Queue is full. Please try again later.');
    expect(component.isLoading).toBeFalse();
  });

  it('falls back to error.error.detail when error.error property is absent', () => {
    chatApi.joinQueue.and.returnValue(
      throwError(() => ({ error: { detail: 'Service unavailable.' } }))
    );

    fixture.detectChanges();

    expect(component.error).toBe('Service unavailable.');
  });

  it('shows default message when no structured error is present', () => {
    chatApi.joinQueue.and.returnValue(throwError(() => ({})));

    fixture.detectChanges();

    expect(component.error).toBe('Failed to connect to support. Please try again.');
  });

  it('uses user displayName and email from AuthService', () => {
    chatApi.joinQueue.and.returnValue(
      of({ sessionId: 'sess-1', queuePosition: 1, estimatedWaitSeconds: 30 })
    );

    fixture.detectChanges();

    expect(chatApi.joinQueue).toHaveBeenCalledWith({
      customerName: 'Jane Doe',
      customerEmail: 'jane@example.com',
    });
  });
});
