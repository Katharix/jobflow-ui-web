import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { OrgSupportChatComponent } from './org-support-chat.component';
import { ChatWidgetService } from '../../common/chat-widget/chat-widget.service';

describe('OrgSupportChatComponent', () => {
  let fixture: ComponentFixture<OrgSupportChatComponent>;
  let chatWidget: jasmine.SpyObj<ChatWidgetService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    chatWidget = jasmine.createSpyObj<ChatWidgetService>('ChatWidgetService', ['openWidget']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [OrgSupportChatComponent],
      providers: [
        { provide: ChatWidgetService, useValue: chatWidget },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrgSupportChatComponent);
  });

  it('opens the chat widget on init', () => {
    fixture.detectChanges();
    expect(chatWidget.openWidget).toHaveBeenCalled();
  });

  it('redirects to dashboard replacing history', () => {
    fixture.detectChanges();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/dashboard'], { replaceUrl: true });
  });
});
