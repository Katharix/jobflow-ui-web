import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizationService } from '../../../services/shared/organization.service';
import { OrganizationDto } from '../../../models/organization';
import {
  SupportHubDataService,
  SupportHubFinancialSummary,
  SupportHubPaymentEvent,
} from '../../services/support-hub-data.service';

@Component({
  selector: 'app-support-hub-billing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-hub-billing.component.html',
  styleUrl: './support-hub-billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubBillingComponent implements OnInit {
  private readonly eventPageSize = 25;

  private readonly organizationService = inject(OrganizationService);
  private readonly supportHubData = inject(SupportHubDataService);
  private readonly cdr = inject(ChangeDetectorRef);

  organizations: OrganizationDto[] = [];
  selectedOrganizationId = '';
  loading = true;

  financialSummary: SupportHubFinancialSummary | null = null;
  payments: SupportHubPaymentEvent[] = [];
  disputes: SupportHubPaymentEvent[] = [];
  paymentNextCursor: string | null = null;
  disputeNextCursor: string | null = null;
  private paymentCursorStack: string[] = [];
  private disputeCursorStack: string[] = [];
  paymentsLoading = false;
  disputesLoading = false;

  ngOnInit(): void {
    this.organizationService.getAllOrganizations().subscribe({
      next: (orgs) => {
        this.organizations = (orgs ?? []) as OrganizationDto[];
        if (this.organizations.length > 0 && this.organizations[0].id) {
          this.selectedOrganizationId = this.organizations[0].id;
          this.loadOrganizationBilling();
        } else {
          this.loading = false;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.organizations = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadOrganizationBilling(): void {
    if (!this.selectedOrganizationId) {
      return;
    }

    this.loading = true;
    this.paymentCursorStack = [];
    this.disputeCursorStack = [];

    this.supportHubData.getOrganizationFinancialSummary(this.selectedOrganizationId).subscribe({
      next: (summary) => {
        this.financialSummary = summary;
        this.cdr.detectChanges();
      },
      error: () => {
        this.financialSummary = null;
        this.cdr.detectChanges();
      },
    });

    this.loadPaymentPage();
    this.loadDisputePage();
  }

  get canGoBackPayments(): boolean {
    return this.paymentCursorStack.length > 0;
  }

  get canGoBackDisputes(): boolean {
    return this.disputeCursorStack.length > 0;
  }

  onNextPaymentsPage(): void {
    if (!this.paymentNextCursor || this.paymentsLoading) {
      return;
    }

    this.paymentCursorStack.push(this.paymentNextCursor);
    this.loadPaymentPage(this.paymentNextCursor);
  }

  onPrevPaymentsPage(): void {
    if (!this.canGoBackPayments || this.paymentsLoading) {
      return;
    }

    this.paymentCursorStack.pop();
    const previousCursor = this.paymentCursorStack.length > 0
      ? this.paymentCursorStack[this.paymentCursorStack.length - 1]
      : undefined;

    this.loadPaymentPage(previousCursor);
  }

  onNextDisputesPage(): void {
    if (!this.disputeNextCursor || this.disputesLoading) {
      return;
    }

    this.disputeCursorStack.push(this.disputeNextCursor);
    this.loadDisputePage(this.disputeNextCursor);
  }

  onPrevDisputesPage(): void {
    if (!this.canGoBackDisputes || this.disputesLoading) {
      return;
    }

    this.disputeCursorStack.pop();
    const previousCursor = this.disputeCursorStack.length > 0
      ? this.disputeCursorStack[this.disputeCursorStack.length - 1]
      : undefined;

    this.loadDisputePage(previousCursor);
  }

  private loadPaymentPage(cursor?: string): void {
    this.paymentsLoading = true;

    this.supportHubData.getOrganizationPayments(this.selectedOrganizationId, cursor, this.eventPageSize).subscribe({
      next: (page) => {
        this.payments = page?.items ?? [];
        this.paymentNextCursor = page?.nextCursor ?? null;
        this.paymentsLoading = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.payments = [];
        this.paymentNextCursor = null;
        this.paymentsLoading = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadDisputePage(cursor?: string): void {
    this.disputesLoading = true;

    this.supportHubData.getOrganizationDisputes(this.selectedOrganizationId, cursor, this.eventPageSize).subscribe({
      next: (page) => {
        this.disputes = page?.items ?? [];
        this.disputeNextCursor = page?.nextCursor ?? null;
        this.disputesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.disputes = [];
        this.disputeNextCursor = null;
        this.disputesLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  amountDollars(cents: number): number {
    return cents / 100;
  }
}
