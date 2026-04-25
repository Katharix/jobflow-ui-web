import { Component, DestroyRef, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '../../views/shared/modal/modal.component';
import { EstimateService } from '../../admin/estimates/services/estimate.service';
import { MilestoneService } from '../../services/shared/milestone.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';

export interface DemoLineItem {
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
  total: number;
}

@Component({
  selector: 'app-first-win-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './first-win-modal.component.html',
  styleUrl: './first-win-modal.component.scss',
})
export class FirstWinModalComponent implements OnInit {
  @Output() sent = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  private estimateService = inject(EstimateService);
  private milestoneService = inject(MilestoneService);
  private orgContext = inject(OrganizationContextService);
  private destroyRef = inject(DestroyRef);

  visible = signal(false);
  sending = signal(false);
  sent$ = signal(false);
  errorMessage = signal<string | null>(null);

  readonly demoLineItems: DemoLineItem[] = [
    { name: 'Initial Consultation', description: 'On-site assessment and project evaluation', qty: 1, unitPrice: 150, total: 150 },
    { name: 'Labor', description: 'Professional service — 2 hours', qty: 2, unitPrice: 75, total: 150 },
    { name: 'Materials & Supplies', description: 'Standard supplies for the project', qty: 1, unitPrice: 85, total: 85 },
  ];

  readonly subtotal = this.demoLineItems.reduce((sum, i) => sum + i.total, 0);

  ngOnInit(): void {
    this.orgContext.org$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(org => {
        const alreadySent = !!org?.firstRealEstimateSentAt;
        const dismissed = localStorage.getItem('jf_first_win_dismissed') === '1';
        this.visible.set(!!org?.id && org?.onboardingComplete === true && !alreadySent && !dismissed);
      });
  }

  sendToMyEmail(): void {
    if (this.sending()) return;
    this.sending.set(true);
    this.errorMessage.set(null);

    this.estimateService.createFirstWin()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.milestoneService.markMilestone('firstRealEstimateSentAt')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => {
                const current = this.orgContext['orgSubject'].value;
                if (current) {
                  this.orgContext.setOrganization({ ...current, firstRealEstimateSentAt: new Date().toISOString() });
                }
                this.sent$.set(true);
                this.sending.set(false);
                this.sent.emit();
              },
              error: () => {
                // Milestone save failed but email sent — still show success
                this.sent$.set(true);
                this.sending.set(false);
                this.sent.emit();
              }
            });
        },
        error: () => {
          this.sending.set(false);
          this.errorMessage.set('Something went wrong. Please try again.');
        }
      });
  }

  dismiss(): void {
    localStorage.setItem('jf_first_win_dismissed', '1');
    this.visible.set(false);
    this.dismissed.emit();
  }
}
