import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChatWidgetService } from '../../common/chat-widget/chat-widget.service';

@Component({
  selector: 'app-org-support-chat',
  standalone: true,
  imports: [CommonModule],
  template: '',
})
export class OrgSupportChatComponent implements OnInit {
  private router = inject(Router);
  private chatWidget = inject(ChatWidgetService);

  ngOnInit(): void {
    // Open the persistent chat widget and navigate back
    this.chatWidget.openWidget();
    this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
  }
}
