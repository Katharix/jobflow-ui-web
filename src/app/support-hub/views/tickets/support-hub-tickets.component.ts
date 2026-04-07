import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../admin/dashboard/page-header/page-header.component';
import { SupportHubDataService } from '../../services/support-hub-data.service';
import { SupportHubTicket } from '../../models/support-hub-ticket';
import { OrganizationService } from '../../../services/shared/organization.service';
import { OrganizationDto } from '../../../models/organization';
import {
  JobflowGridColumn,
  JobflowGridComponent,
  JobflowGridPageSettings
} from '../../../common/jobflow-grid/jobflow-grid.component';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-support-hub-tickets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    JobflowGridComponent,
    ButtonModule,
    SelectModule,
    InputTextModule,
    MessageModule,
    TranslateModule
  ],
  templateUrl: './support-hub-tickets.component.html',
  styleUrl: './support-hub-tickets.component.scss',
})
export class SupportHubTicketsComponent implements OnInit {
  private dataService = inject(SupportHubDataService);
  private organizationService = inject(OrganizationService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<unknown>;

  tickets: SupportHubTicket[] = [];
  organizations: OrganizationDto[] = [];
  organizationOptions: { label: string; value: string }[] = [];
  statusOptions: { label: string; value: SupportHubTicket['status'] }[] = [];
  columns: JobflowGridColumn[] = [];
  pageSettings: JobflowGridPageSettings = { pageSize: 10, pageSizes: [10, 20, 50] };
  selectedOrganizationId = '';
  newTitle = '';
  newSummary = '';
  newStatus: SupportHubTicket['status'] = 'Normal';
  orgSearchTerm = '';
  isOrgModalOpen = false;
  isLoading = true;
  error = '';
  actionMessage = '';

  ngOnInit(): void {
    this.refreshLabels();
    this.translate.onLangChange.subscribe(() => this.refreshLabels());

    this.loadTickets();
    this.organizationService.getAllOrganizations().subscribe({
      next: (organizations) => {
        this.organizations = (organizations ?? []) as OrganizationDto[];
        this.organizationOptions = this.organizations.map((org) => ({
          label: org.organizationName ?? this.translate.instant('support.common.unknownOrganization'),
          value: org.id ?? ''
        }));
        if (!this.selectedOrganizationId && this.organizations.length) {
          this.selectedOrganizationId = this.organizations[0].id ?? '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = this.translate.instant('support.tickets.errors.loadOrganizations');
        this.cdr.detectChanges();
      },
    });
  }

  loadTickets(): void {
    this.isLoading = true;
    this.dataService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = this.translate.instant('support.tickets.errors.loadTickets');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  createTicket(): void {
    this.error = '';
    this.actionMessage = '';

    if (!this.selectedOrganizationId) {
      this.error = this.translate.instant('support.tickets.errors.selectOrganization');
      return;
    }

    if (!this.newTitle.trim()) {
      this.error = this.translate.instant('support.tickets.errors.titleRequired');
      return;
    }

    this.dataService
      .createTicket({
        organizationId: this.selectedOrganizationId,
        title: this.newTitle.trim(),
        summary: this.newSummary.trim() || null,
        status: this.newStatus,
      })
      .subscribe({
        next: () => {
          this.newTitle = '';
          this.newSummary = '';
          this.newStatus = 'Normal';
          this.actionMessage = this.translate.instant('support.tickets.actions.created');
          this.loadTickets();
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = this.translate.instant('support.tickets.errors.createTicket');
          this.cdr.detectChanges();
        },
      });
  }

  get filteredOrganizations(): OrganizationDto[] {
    const query = this.orgSearchTerm.trim().toLowerCase();
    if (!query) {
      return this.organizations;
    }

    return this.organizations.filter((org) =>
      (org.organizationName ?? '').toLowerCase().includes(query)
    );
  }

  openOrgModal(): void {
    this.isOrgModalOpen = true;
    this.orgSearchTerm = '';
  }

  closeOrgModal(): void {
    this.isOrgModalOpen = false;
  }

  selectOrganization(org: OrganizationDto): void {
    this.selectedOrganizationId = org.id ?? '';
    this.closeOrgModal();
  }

  getTicketStatusClass(status: SupportHubTicket['status']): string {
    switch (status) {
      case 'Urgent':
        return 'status-chip status-chip--urgent';
      case 'High':
        return 'status-chip status-chip--high';
      case 'Low':
        return 'status-chip status-chip--low';
      case 'Resolved':
        return 'status-chip status-chip--resolved';
      default:
        return 'status-chip status-chip--normal';
    }
  }

  createdAtAccessor = (_field: string, data: unknown): string => {
    const ticket = data as SupportHubTicket;
    if (!ticket.createdAt) return '—';
    return new Date(ticket.createdAt).toLocaleDateString();
  };

  seedDemo(): void {
    this.error = '';
    this.actionMessage = '';

    if (!this.selectedOrganizationId) {
      this.error = this.translate.instant('support.tickets.errors.seedOrganization');
      return;
    }

    this.dataService.seedDemo(this.selectedOrganizationId).subscribe({
      next: (result) => {
        this.actionMessage = this.translate.instant('support.tickets.actions.seeded', {
          tickets: result.ticketsCreated,
          sessions: result.sessionsCreated
        });
        this.loadTickets();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = this.translate.instant('support.tickets.errors.seedDemo');
        this.cdr.detectChanges();
      },
    });
  }

  copyTicketId(ticket: SupportHubTicket): void {
    const id = ticket.id;
    if (!id) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        this.actionMessage = this.translate.instant('support.tickets.actions.copied');
      });
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = id;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this.actionMessage = this.translate.instant('support.tickets.actions.copied');
  }

  getTicketStatusLabelKey(status: SupportHubTicket['status']): string {
    switch (status) {
      case 'Urgent':
        return 'support.tickets.status.urgent';
      case 'High':
        return 'support.tickets.status.high';
      case 'Low':
        return 'support.tickets.status.low';
      case 'Resolved':
        return 'support.tickets.status.resolved';
      default:
        return 'support.tickets.status.normal';
    }
  }

  private refreshLabels(): void {
    this.columns = [
      { field: 'title', headerText: this.translate.instant('support.tickets.columns.title') },
      { field: 'organizationName', headerText: this.translate.instant('support.tickets.columns.organization') },
      {
        headerText: this.translate.instant('support.tickets.columns.opened'),
        width: 140,
        textAlign: 'Center',
        valueAccessor: this.createdAtAccessor
      },
      {
        headerText: this.translate.instant('support.tickets.columns.status'),
        width: 140,
        textAlign: 'Center',
        template: this.statusTemplate
      },
      {
        headerText: this.translate.instant('support.tickets.columns.actions'),
        width: 140,
        textAlign: 'Right',
        template: this.actionsTemplate
      }
    ];

    this.statusOptions = [
      { label: this.translate.instant('support.tickets.status.urgent'), value: 'Urgent' },
      { label: this.translate.instant('support.tickets.status.high'), value: 'High' },
      { label: this.translate.instant('support.tickets.status.normal'), value: 'Normal' },
      { label: this.translate.instant('support.tickets.status.low'), value: 'Low' }
    ];
  }
}
