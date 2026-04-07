import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../admin/dashboard/page-header/page-header.component';
import { SupportHubInviteService } from '../../services/support-hub-invite.service';
import { SupportHubInvite } from '../../models/support-hub-invite';
import {
  JobflowGridColumn,
  JobflowGridComponent,
  JobflowGridPageSettings
} from '../../../common/jobflow-grid/jobflow-grid.component';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-support-hub-people',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    JobflowGridComponent,
    ButtonModule,
    SelectModule,
    MessageModule
  ],
  templateUrl: './support-hub-people.component.html',
  styleUrl: './support-hub-people.component.scss',
})
export class SupportHubPeopleComponent implements OnInit {
  private invitesService = inject(SupportHubInviteService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('staffStatusTemplate', { static: true }) staffStatusTemplate!: TemplateRef<unknown>;

  readonly staff = [
    { name: 'Avery Rivera', role: 'KatharixAdmin', status: 'Online' },
    { name: 'Maya Patel', role: 'KatharixEmployee', status: 'In session' },
    { name: 'Jordan Park', role: 'KatharixEmployee', status: 'Available' },
  ];

  invites: SupportHubInvite[] = [];
  inviteColumns: JobflowGridColumn[] = [];
  staffColumns: JobflowGridColumn[] = [];
  pageSettings: JobflowGridPageSettings = { pageSize: 10, pageSizes: [10, 20, 50] };
  inviteRoleOptions: { label: string; value: SupportHubInvite['role'] }[] = [
    { label: 'Katharix Admin', value: 'KatharixAdmin' },
    { label: 'Katharix Employee', value: 'KatharixEmployee' }
  ];
  inviteError = '';
  isLoadingInvites = true;
  isCreatingInvite = false;
  newInviteRole: SupportHubInvite['role'] = 'KatharixEmployee';

  ngOnInit(): void {
    this.inviteColumns = [
      { field: 'code', headerText: 'Invite Code', width: 200 },
      { field: 'role', headerText: 'Role' },
      { headerText: 'Expires', width: 180, valueAccessor: this.inviteExpiryAccessor }
    ];

    this.staffColumns = [
      { field: 'name', headerText: 'Name' },
      { field: 'role', headerText: 'Role' },
      { headerText: 'Status', width: 160, textAlign: 'Center', template: this.staffStatusTemplate }
    ];

    this.loadInvites();
  }

  loadInvites(): void {
    this.isLoadingInvites = true;
    this.invitesService.listInvites().subscribe({
      next: (invites) => {
        this.invites = invites.filter((invite) => !invite.redeemedAt);
        this.inviteError = '';
        this.isLoadingInvites = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.inviteError = 'Unable to load invites.';
        this.isLoadingInvites = false;
        this.cdr.detectChanges();
      },
    });
  }

  createInvite(): void {
    if (this.isCreatingInvite) {
      return;
    }

    this.isCreatingInvite = true;
    this.invitesService.createInvite(this.newInviteRole).subscribe({
      next: () => {
        this.loadInvites();
        this.isCreatingInvite = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.inviteError = 'Unable to create invite.';
        this.isCreatingInvite = false;
        this.cdr.detectChanges();
      },
    });
  }

  inviteExpiryAccessor = (_field: string, data: unknown): string => {
    const invite = data as SupportHubInvite;
    if (!invite.expiresAt) return '—';
    return new Date(invite.expiresAt).toLocaleDateString();
  };
}
