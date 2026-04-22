import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
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
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-support-hub-sessions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    JobflowGridComponent,
    ButtonModule,
    SelectModule,
    InputTextModule,
    MessageModule,
    TranslateModule
  ],
  templateUrl: './support-hub-sessions.component.html',
  styleUrl: './support-hub-sessions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubSessionsComponent implements OnInit {
  private dataService = inject(SupportHubDataService);
  private organizationService = inject(OrganizationService);
  private auth = inject(Auth);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<unknown>;
  @ViewChild('actionsTemplate', { static: true }) actionsTemplate!: TemplateRef<unknown>;

  sessions: SupportHubSession[] = [];
  organizations: OrganizationDto[] = [];
  organizationOptions: { label: string; value: string }[] = [];
  statusOptions: { label: string; value: SupportHubSession['status'] }[] = [];
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
    this.refreshLabels();
    this.translate.onLangChange.subscribe(() => this.refreshLabels());

    this.loadSessions();
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
        this.error = this.translate.instant('support.sessions.errors.loadOrganizations');
        this.cdr.detectChanges();
      },
    });
  }

  loadSessions(): void {
    this.isLoading = true;
    this.dataService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = this.translate.instant('support.sessions.errors.loadSessions');
        this.isLoading = false;
        this.cdr.detectChanges();
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
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = this.translate.instant('support.sessions.errors.startScreen');
        this.viewingSessionId = null;
        this.cdr.detectChanges();
      },
    });
  }

  createSession(): void {
    this.error = '';
    this.actionMessage = '';

    if (!this.selectedOrganizationId) {
      this.error = this.translate.instant('support.sessions.errors.selectOrganization');
      return;
    }

    if (!this.newAgentName.trim()) {
      this.error = this.translate.instant('support.sessions.errors.agentRequired');
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
          this.actionMessage = this.translate.instant('support.sessions.actions.created');
          this.loadSessions();
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = this.translate.instant('support.sessions.errors.createSession');
          this.cdr.detectChanges();
        },
      });
  }

  assignToMe(): void {
    const currentUser = this.auth.currentUser;
    if (currentUser?.email) {
      this.newAgentName = currentUser.email;
      return;
    }

    this.newAgentName = this.translate.instant('support.sessions.defaultAgent');
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
      return this.translate.instant('support.sessions.status.followup');
    }
    return this.translate.instant(this.getSessionStatusLabelKey(status));
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
        this.actionMessage = this.translate.instant('support.sessions.actions.copied');
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
    this.actionMessage = this.translate.instant('support.sessions.actions.copied');
  }

  getSessionStatusLabelKey(status: SupportHubSession['status']): string {
    switch (status) {
      case 'Live':
        return 'support.sessions.status.live';
      case 'Queued':
        return 'support.sessions.status.queued';
      case 'FollowUp':
        return 'support.sessions.status.followup';
      case 'Ended':
        return 'support.sessions.status.ended';
      default:
        return 'support.sessions.status.queued';
    }
  }

  private refreshLabels(): void {
    this.columns = [
      { field: 'organizationName', headerText: this.translate.instant('support.sessions.columns.organization') },
      { field: 'agentName', headerText: this.translate.instant('support.sessions.columns.agent') },
      {
        headerText: this.translate.instant('support.sessions.columns.status'),
        width: 140,
        textAlign: 'Center',
        template: this.statusTemplate
      },
      {
        headerText: this.translate.instant('support.sessions.columns.actions'),
        width: 170,
        textAlign: 'Right',
        template: this.actionsTemplate
      }
    ];

    this.statusOptions = [
      { label: this.translate.instant('support.sessions.status.live'), value: 'Live' },
      { label: this.translate.instant('support.sessions.status.queued'), value: 'Queued' },
      { label: this.translate.instant('support.sessions.status.followup'), value: 'FollowUp' },
      { label: this.translate.instant('support.sessions.status.ended'), value: 'Ended' }
    ];
  }
}
