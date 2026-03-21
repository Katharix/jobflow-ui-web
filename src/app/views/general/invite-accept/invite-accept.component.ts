import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InviteService, InviteInfo } from './invite.service';

@Component({
  selector: 'app-invite-accept',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './invite-accept.component.html',
  styleUrls: ['./invite-accept.component.scss']
})
export class InviteAcceptComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private inviteService = inject(InviteService);

  inviteInfo?: InviteInfo;
  inviteToken?: string;
  isLoading = true;
  isAccepted = false;
  error?: string;

  ngOnInit() {
    const code = this.route.snapshot.paramMap.get('code');
    if (!code) {
      this.error = 'Invalid invite link.';
      this.isLoading = false;
      return;
    }

    this.inviteService.getInviteByCode(code).subscribe({
      next: (invite) => {
        this.inviteInfo = invite;
        this.inviteToken = invite.inviteToken;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'This invite link is invalid or expired.';
        this.isLoading = false;
      }
    });
  }

  onAccept() {
    if (!this.inviteToken) return;

    this.isLoading = true;
    this.inviteService.acceptInvite(this.inviteToken).subscribe({
      next: () => {
        this.isAccepted = true;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Something went wrong accepting your invite.';
        this.isLoading = false;
      }
    });
  }
}
