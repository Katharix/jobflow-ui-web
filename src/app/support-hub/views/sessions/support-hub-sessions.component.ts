import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { PageHeaderComponent } from '../../../admin/dashboard/page-header/page-header.component';
import { SupportHubDataService } from '../../services/support-hub-data.service';
import { SupportHubSession } from '../../models/support-hub-session';
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
  selector: 'app-support-hub-sessions',
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
  templateUrl: './support-hub-sessions.component.html',
  styleUrl: './support-hub-sessions.component.scss',
})
export class SupportHubSessionsComponent implements OnInit {
  private dataService = inject(SupportHubDataService);
  private organizationService = inject(OrganizationService);
  private auth = inject(Auth);

  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<unknown>;

  sessions: SupportHubSession[] = [];
  organizations: OrganizationDto[] = [];
  organizationOptions: { label: string; value: string }[] = [];
  statusOptions: { label: string; value: SupportHubSession['status'] }[] = [
    { label: 'Live', value: 'Live' },
    { label: 'Queued', value: 'Queued' },
    { label: 'Follow-up', value: 'FollowUp' },
    { label: 'Ended', value: 'Ended' }
  ];
  columns: JobflowGridColumn[] = [];
  pageSettings: JobflowGridPageSettings = { pageSize: 10, pageSizes: [10, 20, 50] };
  selectedOrganizationId = '';
  newAgentName = '';
  newStatus: SupportHubSession['status'] = 'Queued';
  orgSearchTerm = '';
  isOrgModalOpen = false;
  isLoading = true;
  error = '';
  viewingSessionId: string | null = null;
  actionMessage = '';

  ngOnInit(): void {
    this.columns = [
      { field: 'organizationName', headerText: 'Organization' },
      { field: 'agentName', headerText: 'Agent' },
      { headerText: 'Status', width: 140, textAlign: 'Center', template: this.statusTemplate },
      { headerText: 'Actions', width: 170, textAlign: 'Right', template: this.actionsTemplate }
    ];

    this.loadSessions();
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

  loadSessions(): void {
    this.isLoading = true;
    this.dataService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Unable to load sessions.';
        this.isLoading = false;
      },
    });
  }

  onViewScreen(sessionId: string): void {
    if (this.viewingSessionId) {
      return;
    }

    this.viewingSessionId = sessionId;
    this.dataService.requestScreenView(sessionId).subscribe({
      next: (response) => {
        window.open(response.viewerUrl, '_blank');
        this.viewingSessionId = null;
      },
      error: () => {
        this.error = 'Unable to start screen view.';
        this.viewingSessionId = null;
      },
    });
  }

  createSession(): void {
    this.error = '';
    this.actionMessage = '';

    if (!this.selectedOrganizationId) {
      this.error = 'Select an organization before creating a session.';
      return;
    }

    if (!this.newAgentName.trim()) {
      this.error = 'Agent name is required.';
      return;
    }

    this.dataService
      .createSession({
        organizationId: this.selectedOrganizationId,
        agentName: this.newAgentName.trim(),
        status: this.newStatus,
      })
      .subscribe({
        next: () => {
          this.newAgentName = '';
          this.newStatus = 'Queued';
          this.actionMessage = 'Session created.';
          this.loadSessions();
        },
        error: () => {
          this.error = 'Unable to create session.';
        },
      });
  }

  assignToMe(): void {
    const currentUser = this.auth.currentUser;
    if (currentUser?.email) {
      this.newAgentName = currentUser.email;
      return;
    }

    this.newAgentName = 'Katharix Staff';
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

  formatSessionStatus(status: SupportHubSession['status']): string {
    if (status === 'FollowUp') {
      return 'Follow-up';
    }
    return status;
  }

  getSessionStatusClass(status: SupportHubSession['status']): string {
    switch (status) {
      case 'Live':
        return 'status-chip status-chip--live';
      case 'Queued':
        return 'status-chip status-chip--queued';
      case 'Ended':
        return 'status-chip status-chip--ended';
      default:
        return 'status-chip status-chip--followup';
    }
  }

  copySessionId(session: SupportHubSession): void {
    const id = session.id;
    if (!id) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        this.actionMessage = 'Session ID copied.';
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
    this.actionMessage = 'Session ID copied.';
  }
}
