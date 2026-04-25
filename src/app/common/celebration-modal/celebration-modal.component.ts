import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import confetti from 'canvas-confetti';
import { ModalComponent } from '../../views/shared/modal/modal.component';
import { MilestoneService } from '../../services/shared/milestone.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';

@Component({
  selector: 'app-celebration-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './celebration-modal.component.html',
  styleUrl: './celebration-modal.component.scss',
})
export class CelebrationModalComponent implements OnInit {
  private orgContext = inject(OrganizationContextService);
  private milestoneService = inject(MilestoneService);
  private destroyRef = inject(DestroyRef);

  visible = signal(false);
  referralLinkCopied = signal(false);

  ngOnInit(): void {
    this.orgContext.org$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(org => {
        const hasFirstWin = !!org?.firstRealEstimateSentAt;
        const alreadyShown = !!org?.referralCtaShownAt;
        const dismissed = localStorage.getItem('jf_celebration_dismissed') === '1';

        if (hasFirstWin && !alreadyShown && !dismissed) {
          this.visible.set(true);
          this.launchConfetti();
          this.recordShown();
        }
      });
  }

  private launchConfetti(): void {
    const end = Date.now() + 2500;
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }

  private recordShown(): void {
    this.milestoneService.markMilestone('referralCtaShownAt')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const current = this.orgContext['orgSubject'].value;
          if (current) {
            this.orgContext.setOrganization({ ...current, referralCtaShownAt: new Date().toISOString() });
          }
        }
      });
  }

  copyReferralLink(): void {
    const link = this.getReferralLink();
    navigator.clipboard.writeText(link).then(() => {
      this.referralLinkCopied.set(true);
      setTimeout(() => this.referralLinkCopied.set(false), 2500);
    });
  }

  shareReferral(): void {
    const link = this.getReferralLink();
    const text = `I just started using JobFlow to manage my business estimates and invoicing. Check it out:`;
    if (navigator.share) {
      navigator.share({ title: 'JobFlow', text, url: link });
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text + ' ' + link)}`, '_blank');
    }
  }

  dismiss(): void {
    localStorage.setItem('jf_celebration_dismissed', '1');
    this.visible.set(false);
  }

  private getReferralLink(): string {
    const org = this.orgContext['orgSubject'].value;
    const id = org?.id ?? '';
    return `${window.location.origin}/refer?ref=${id}`;
  }
}
