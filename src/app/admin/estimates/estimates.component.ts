import { Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PageHeaderComponent } from '../dashboard/page-header/page-header.component';
import { JobflowGridColumn, JobflowGridComponent, JobflowGridPageSettings } from '../../common/jobflow-grid/jobflow-grid.component';
import { JobflowDrawerComponent } from '../../common/jobflow-drawer/jobflow-drawer.component';
import { ToastService } from '../../common/toast/toast.service';
import { EstimateService } from './services/estimate.service';
import { EstimateFormComponent } from './estimate-form/estimate-form.component';
import { Estimate, EstimateStatus } from './models/estimate';
import { useNotifierHub, NotifierHubHandle } from '../services/useNotifierHub';

@Component({
  selector: 'app-estimates',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    PageHeaderComponent,
    JobflowGridComponent,
    JobflowDrawerComponent,
    EstimateFormComponent,
  ],
  templateUrl: './estimates.component.html',
  styleUrl: './estimates.component.scss',
})
export class EstimatesComponent implements OnInit, OnDestroy {
  private estimateService = inject(EstimateService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private auth = inject(Auth);

  @ViewChild('clientTemplate', { static: true }) clientTemplate!: TemplateRef<unknown>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<unknown>;

  columns: JobflowGridColumn[] = [];
  items: Estimate[] = [];
  error: string | null = null;
  pageSettings: JobflowGridPageSettings = { pageSize: 20, pageSizes: [10, 20, 50, 100] };

  summary = {
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    declined: 0,
    totalValue: 0,
  };

  statusFilters: { key: string; label: string; status?: EstimateStatus }[] = [];
  selectedStatusFilter = 'all';

  headerActions = [] as { label: string; icon: string; class: string; click: () => void }[];

  isFormDrawerOpen = false;
  isSendDrawerOpen = false;
  editingEstimate: Estimate | null = null;
  estimateToSend: Estimate | null = null;

  sendEmail = '';
  sendMessage = '';
  sending = false;
  sendError: string | null = null;

  private toast = inject(ToastService);
  private translateLangSub = this.translate.onLangChange.subscribe(() => this.refreshLabels());
  private notifierHub: NotifierHubHandle | null = null;

  ngOnInit(): void {
    this.refreshLabels();
    this.load();

    this.notifierHub = useNotifierHub(this.auth, {
      onEstimateStatusChanged: () => this.load(),
      onEstimateRevisionRequested: () => this.load(),
    });
    void this.notifierHub.connect();
  }

  ngOnDestroy(): void {
    void this.notifierHub?.disconnect();
    this.translateLangSub?.unsubscribe();
  }

  private refreshLabels(): void {
    this.statusFilters = [
      { key: 'all', label: this.translate.instant('admin.estimates.filters.all') },
      { key: 'draft', label: this.translate.instant('admin.estimates.filters.draft'), status: EstimateStatus.Draft },
      { key: 'sent', label: this.translate.instant('admin.estimates.filters.sent'), status: EstimateStatus.Sent },
      { key: 'accepted', label: this.translate.instant('admin.estimates.filters.accepted'), status: EstimateStatus.Accepted },
      { key: 'declined', label: this.translate.instant('admin.estimates.filters.declined'), status: EstimateStatus.Declined },
      { key: 'expired', label: this.translate.instant('admin.estimates.filters.expired'), status: EstimateStatus.Expired },
    ];

    this.headerActions = [
      {
        label: this.translate.instant('admin.estimates.actions.new'),
        icon: 'plus',
        class: 'btn-primary',
        click: this.openNew.bind(this),
      },
    ];

    this.buildColumns();
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
        this.updateSummary(this.items);
      },
      error: () => {
        this.error = this.translate.instant('admin.estimates.errors.load');
      },
    });
  }

  openNew(): void {
    this.editingEstimate = null;
    this.isFormDrawerOpen = true;
  }

  get filteredItems(): Estimate[] {
    if (this.selectedStatusFilter === 'all') {
      return this.items;
    }

    const target = this.statusFilters.find(filter => filter.key === this.selectedStatusFilter);
    if (!target?.status && target?.status !== 0) {
      return this.items;
    }

    return this.items.filter(estimate => this.resolveStatus(estimate.status) === target.status);
  }

  setStatusFilter(key: string): void {
    this.selectedStatusFilter = key;
  }

  getFilterCount(key: string): number {
    if (key === 'all') {
      return this.summary.total;
    }

    const target = this.statusFilters.find(filter => filter.key === key);
    if (!target?.status && target?.status !== 0) {
      return 0;
    }

    return this.items.filter(estimate => this.resolveStatus(estimate.status) === target.status).length;
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
      this.toast.success(this.translate.instant('admin.estimates.toast.updated'));
      return;
    }

    const recipientEmail = result.organizationClient?.emailAddress ?? '';
    if (!recipientEmail.trim()) {
      this.load();
      this.toast.warning(this.translate.instant('admin.estimates.toast.createdMissingEmail'));
      return;
    }

    this.estimateService
      .send(result.id, {
        recipientEmail: recipientEmail.trim(),
      })
      .subscribe({
        next: () => {
          this.load();
          this.toast.success(this.translate.instant('admin.estimates.toast.createdSent'));
        },
        error: () => {
          this.load();
          this.toast.error(this.translate.instant('admin.estimates.toast.createdSendFailed'));
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
            this.toast.success(this.translate.instant('admin.estimates.toast.sent'));
        },
        error: () => {
          this.sending = false;
            this.sendError = this.translate.instant('admin.estimates.errors.send');
        },
      });
  }

  deleteEstimate(estimate: Estimate): void {
    const confirmMessage = this.translate.instant('admin.estimates.confirm.delete', {
      number: estimate.estimateNumber,
    });
    if (!confirm(confirmMessage)) return;
    this.estimateService.delete(estimate.id).subscribe({
      next: () => {
        this.load();
        this.toast.success(this.translate.instant('admin.estimates.toast.deleted'));
      },
      error: () => this.toast.show(this.translate.instant('admin.estimates.toast.deleteFailed'), undefined, 'error'),
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
    switch (s) {
      case EstimateStatus.Draft:
        return this.translate.instant('admin.estimates.status.draft');
      case EstimateStatus.Sent:
        return this.translate.instant('admin.estimates.status.sent');
      case EstimateStatus.Accepted:
        return this.translate.instant('admin.estimates.status.accepted');
      case EstimateStatus.Declined:
        return this.translate.instant('admin.estimates.status.declined');
      case EstimateStatus.Cancelled:
        return this.translate.instant('admin.estimates.status.cancelled');
      case EstimateStatus.Expired:
        return this.translate.instant('admin.estimates.status.expired');
      case EstimateStatus.RevisionRequested:
        return this.translate.instant('admin.estimates.status.revisionRequested');
      default:
        return this.translate.instant('admin.estimates.labels.unknown');
    }
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
      { field: 'estimateNumber', headerText: this.translate.instant('admin.estimates.table.estimateNumber'), width: 145 },
      {
        headerText: this.translate.instant('admin.estimates.table.client'),
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
        headerText: this.translate.instant('admin.estimates.table.date'),
        width: 135,
        valueAccessor: (_: string, d: unknown) => this.formatDate((d as Estimate)?.createdAt),
      },
      {
        field: 'expirationDate',
        headerText: this.translate.instant('admin.estimates.table.expires'),
        width: 130,
        valueAccessor: (_: string, d: unknown) => this.formatDate((d as Estimate)?.expirationDate),
      },
      {
        field: 'total',
        headerText: this.translate.instant('admin.estimates.table.total'),
        width: 120,
        textAlign: 'Right',
        valueAccessor: (_: string, d: unknown) => this.formatCurrency((d as Estimate)?.total ?? 0),
      },
      {
        headerText: this.translate.instant('admin.estimates.table.status'),
        width: 115,
        sortField: 'status',
        searchFields: ['status'],
        template: this.statusTemplate,
      },
      { headerText: this.translate.instant('admin.estimates.table.actions'), width: 185, template: this.actionsTemplate, textAlign: 'Right' },
    ];
  }

  private formatDate(val?: string): string {
    if (!val) return this.translate.instant('admin.estimates.labels.missing');
    const d = new Date(val);
    return isNaN(d.getTime())
      ? this.translate.instant('admin.estimates.labels.missing')
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val ?? 0);
  }

  private updateSummary(estimates: Estimate[]): void {
    const summary = {
      total: estimates.length,
      draft: 0,
      sent: 0,
      accepted: 0,
      declined: 0,
      totalValue: 0,
    };

    for (const estimate of estimates) {
      const status = this.resolveStatus(estimate.status);
      if (status === EstimateStatus.Draft) summary.draft += 1;
      if (status === EstimateStatus.Sent) summary.sent += 1;
      if (status === EstimateStatus.Accepted) summary.accepted += 1;
      if (status === EstimateStatus.Declined) summary.declined += 1;
      summary.totalValue += estimate.total ?? 0;
    }

    this.summary = summary;
  }
}
