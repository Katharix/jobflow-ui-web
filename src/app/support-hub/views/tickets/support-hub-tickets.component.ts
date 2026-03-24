import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
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
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-support-hub-tickets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    JobflowGridComponent,
    ButtonModule,
    DropdownModule,
    InputTextModule,
    MessageModule
  ],
  templateUrl: './support-hub-tickets.component.html',
  styleUrl: './support-hub-tickets.component.scss',
})
export class SupportHubTicketsComponent implements OnInit {
  private dataService = inject(SupportHubDataService);
  private organizationService = inject(OrganizationService);

  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<unknown>;

  tickets: SupportHubTicket[] = [];
  organizations: OrganizationDto[] = [];
  organizationOptions: { label: string; value: string }[] = [];
  statusOptions: { label: string; value: SupportHubTicket['status'] }[] = [
    { label: 'Urgent', value: 'Urgent' },
    { label: 'High', value: 'High' },
    { label: 'Normal', value: 'Normal' },
    { label: 'Low', value: 'Low' }
  ];
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
    this.columns = [
      { field: 'title', headerText: 'Title' },
      { field: 'organizationName', headerText: 'Organization' },
      { headerText: 'Opened', width: 140, textAlign: 'Center', valueAccessor: this.createdAtAccessor },
      { headerText: 'Status', width: 140, textAlign: 'Center', template: this.statusTemplate },
      { headerText: 'Actions', width: 140, textAlign: 'Right', template: this.actionsTemplate }
    ];

    this.loadTickets();
    this.organizationService.getAllOrganizations().subscribe({
      next: (organizations) => {
        this.organizations = (organizations ?? []) as OrganizationDto[];
        this.organizationOptions = this.organizations.map((org) => ({
          label: org.organizationName ?? 'Unknown',
          value: org.id ?? ''
        }));
        if (!this.selectedOrganizationId && this.organizations.length) {
          this.selectedOrganizationId = this.organizations[0].id ?? '';
        }
      },
      error: () => {
        this.error = 'Unable to load organizations.';
      },
    });
  }

  loadTickets(): void {
    this.isLoading = true;
    this.dataService.getTickets().subscribe({
      next: (tickets) => {
        this.tickets = tickets ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Unable to load tickets.';
        this.isLoading = false;
      },
    });
  }

  createTicket(): void {
    this.error = '';
    this.actionMessage = '';

    if (!this.selectedOrganizationId) {
      this.error = 'Select an organization before creating a ticket.';
      return;
    }

    if (!this.newTitle.trim()) {
      this.error = 'Ticket title is required.';
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
          this.actionMessage = 'Ticket created.';
          this.loadTickets();
        },
        error: () => {
          this.error = 'Unable to create ticket.';
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
      this.error = 'Select an organization before seeding.';
      return;
    }

    this.dataService.seedDemo(this.selectedOrganizationId).subscribe({
      next: (result) => {
        this.actionMessage = `Seeded ${result.ticketsCreated} tickets and ${result.sessionsCreated} sessions.`;
        this.loadTickets();
      },
      error: () => {
        this.error = 'Unable to seed demo data.';
      },
    });
  }

  copyTicketId(ticket: SupportHubTicket): void {
    const id = ticket.id;
    if (!id) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        this.actionMessage = 'Ticket ID copied.';
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
    this.actionMessage = 'Ticket ID copied.';
  }
}
