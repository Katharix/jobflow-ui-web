import { Component, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent } from '../dashboard/page-header/page-header.component';
import { JobflowGridColumn, JobflowGridComponent, JobflowGridPageSettings } from '../../common/jobflow-grid/jobflow-grid.component';
import { JobflowDrawerComponent } from '../../common/jobflow-drawer/jobflow-drawer.component';
import { ToastService } from '../../common/toast/toast.service';
import { EstimateService } from './services/estimate.service';
import { EstimateFormComponent } from './estimate-form/estimate-form.component';
import { Estimate, EstimateStatus, EstimateStatusLabels } from './models/estimate';

@Component({
  selector: 'app-estimates',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    JobflowGridComponent,
    JobflowDrawerComponent,
    EstimateFormComponent,
  ],
  templateUrl: './estimates.component.html',
  styleUrl: './estimates.component.scss',
})
export class EstimatesComponent implements OnInit {
  private estimateService = inject(EstimateService);
  private router = inject(Router);

  @ViewChild('clientTemplate', { static: true }) clientTemplate!: TemplateRef<unknown>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<unknown>;

  columns: JobflowGridColumn[] = [];
  items: Estimate[] = [];
  error: string | null = null;
  pageSettings: JobflowGridPageSettings = { pageSize: 20, pageSizes: [10, 20, 50, 100] };

  isFormDrawerOpen = false;
  isSendDrawerOpen = false;
  editingEstimate: Estimate | null = null;
  estimateToSend: Estimate | null = null;

  sendEmail = '';
  sendMessage = '';
  sending = false;
  sendError: string | null = null;

  private toast = inject(ToastService);

  ngOnInit(): void {
    this.buildColumns();
    this.load();
  }

  load(): void {
    this.estimateService.getByOrganization().subscribe({
      next: (estimates) => {
        this.items = [...estimates].sort(
          (a, b) => {
            const aDate = new Date(a.estimateDate ?? a.createdAt ?? 0).getTime();
            const bDate = new Date(b.estimateDate ?? b.createdAt ?? 0).getTime();
            return bDate - aDate;
          },
        );
      },
      error: () => {
        this.error = 'Failed to load estimates. Please refresh.';
      },
    });
  }

  openNew(): void {
    this.editingEstimate = null;
    this.isFormDrawerOpen = true;
  }

  openEdit(estimate: Estimate): void {
    this.editingEstimate = estimate;
    this.isFormDrawerOpen = true;
  }

  onFormSaved(result: Estimate): void {
    const isCreate = !this.editingEstimate;

    this.isFormDrawerOpen = false;
    this.editingEstimate = null;

    if (!isCreate) {
      this.load();
      this.toast.success('Estimate updated successfully.');
      return;
    }

    const recipientEmail = result.organizationClient?.emailAddress ?? '';
    if (!recipientEmail.trim()) {
      this.load();
      this.toast.warning('Estimate created, but client email is missing so it was not sent.');
      return;
    }

    this.estimateService
      .send(result.id, {
        recipientEmail: recipientEmail.trim(),
      })
      .subscribe({
        next: () => {
          this.load();
          this.toast.success('Estimate created and sent.');
        },
        error: () => {
          this.load();
          this.toast.error('Estimate created but failed to send.');
        },
      });
  }

  onFormCancelled(): void {
    this.isFormDrawerOpen = false;
    this.editingEstimate = null;
  }

  openSend(estimate: Estimate): void {
    this.estimateToSend = estimate;
    this.sendEmail = estimate.organizationClient?.emailAddress ?? '';
    this.sendMessage = '';
    this.sendError = null;
    this.isSendDrawerOpen = true;
  }

  confirmSend(): void {
    if (!this.estimateToSend || !this.sendEmail.trim()) return;
    this.sending = true;
    this.sendError = null;

    this.estimateService
      .send(this.estimateToSend.id, {
        recipientEmail: this.sendEmail.trim(),
        message: this.sendMessage.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.sending = false;
          this.isSendDrawerOpen = false;
          this.load();
          this.toast.success('Estimate sent successfully.');
        },
        error: () => {
          this.sending = false;
          this.sendError = 'Failed to send estimate. Please try again.';
        },
      });
  }

  deleteEstimate(estimate: Estimate): void {
    if (!confirm(`Delete estimate ${estimate.estimateNumber}? This cannot be undone.`)) return;
    this.estimateService.delete(estimate.id).subscribe({
      next: () => {
        this.load();
        this.toast.success('Estimate deleted.');
      },
      error: () => this.toast.show('Failed to delete estimate.', undefined, 'error'),
    });
  }

  getClientName(estimate: Estimate): string {
    const c = estimate.organizationClient;
    if (!c) return '—';
    return `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || '—';
  }

  getClientEmail(estimate: Estimate): string {
    return estimate.organizationClient?.emailAddress ?? '';
  }

  getStatusLabel(estimate: Estimate): string {
    const s = this.resolveStatus(estimate.status);
    return EstimateStatusLabels[s] ?? 'Unknown';
  }

  getStatusClass(estimate: Estimate): string {
    const map: Record<EstimateStatus, string> = {
      [EstimateStatus.Draft]: 'status-draft',
      [EstimateStatus.Sent]: 'status-sent',
      [EstimateStatus.Accepted]: 'status-accepted',
      [EstimateStatus.Declined]: 'status-declined',
      [EstimateStatus.Cancelled]: 'status-cancelled',
      [EstimateStatus.Expired]: 'status-expired',
      [EstimateStatus.RevisionRequested]: 'status-revision-requested',
    };
    return map[this.resolveStatus(estimate.status)] ?? 'status-unknown';
  }

  resolveStatus(raw: unknown): EstimateStatus {
    if (typeof raw === 'number') return raw as EstimateStatus;
    if (typeof raw === 'string') {
      const normalized = raw.trim().toLowerCase();
      if (normalized === 'draft') return EstimateStatus.Draft;
      if (normalized === 'sent') return EstimateStatus.Sent;
      if (normalized === 'accepted') return EstimateStatus.Accepted;
      if (normalized === 'declined') return EstimateStatus.Declined;
      if (normalized === 'cancelled') return EstimateStatus.Cancelled;
      if (normalized === 'expired') return EstimateStatus.Expired;
      if (normalized === 'revisionrequested' || normalized === 'revision requested') {
        return EstimateStatus.RevisionRequested;
      }

      const parsed = Number(normalized);
      return isNaN(parsed) ? EstimateStatus.Draft : (parsed as EstimateStatus);
    }

    const n = Number(raw);
    return isNaN(n) ? EstimateStatus.Draft : (n as EstimateStatus);
  }

  private buildColumns(): void {
    this.columns = [
      { field: 'estimateNumber', headerText: 'Estimate #', width: 145 },
      {
        headerText: 'Client',
        width: 220,
        sortField: 'organizationClient.firstName',
        searchFields: [
          'organizationClient.firstName',
          'organizationClient.lastName',
          'organizationClient.emailAddress',
        ],
        template: this.clientTemplate,
      },
      {
        field: 'createdAt',
        headerText: 'Date',
        width: 135,
        valueAccessor: (_: string, d: Estimate) => this.formatDate(d.createdAt),
      },
      {
        field: 'expirationDate',
        headerText: 'Expires',
        width: 130,
        valueAccessor: (_: string, d: Estimate) => this.formatDate(d.expirationDate),
      },
      {
        field: 'total',
        headerText: 'Total',
        width: 120,
        textAlign: 'Right',
        valueAccessor: (_: string, d: Estimate) => this.formatCurrency(d.total),
      },
      {
        headerText: 'Status',
        width: 115,
        sortField: 'status',
        searchFields: ['status'],
        template: this.statusTemplate,
      },
      { headerText: 'Actions', width: 185, template: this.actionsTemplate, textAlign: 'Right' },
    ];
  }

  private formatDate(val?: string): string {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  private formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val ?? 0);
  }
}
