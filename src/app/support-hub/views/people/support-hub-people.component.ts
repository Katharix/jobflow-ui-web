import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../admin/dashboard/page-header/page-header.component';
import { SupportHubInviteService } from '../../services/support-hub-invite.service';
import { SupportHubDataService } from '../../services/support-hub-data.service';
import { SupportHubInvite } from '../../models/support-hub-invite';
import { SupportHubStaffMember } from '../../models/support-hub-staff';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-support-hub-people',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageHeaderComponent,
    ButtonModule,
    SelectModule,
    TagModule,
    DialogModule
  ],
  templateUrl: './support-hub-people.component.html',
  styleUrl: './support-hub-people.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubPeopleComponent implements OnInit {
  private invitesService = inject(SupportHubInviteService);
  private dataService = inject(SupportHubDataService);
  private cdr = inject(ChangeDetectorRef);

  // Staff
  staff: SupportHubStaffMember[] = [];
  loadingStaff = true;

  // Invites
  invites: SupportHubInvite[] = [];
  loadingInvites = true;
  creatingInvite = false;

  // Invite form
  newInviteRole: SupportHubInvite['role'] = 'KatharixEmployee';
  roleOptions = [
    { label: 'Admin', value: 'KatharixAdmin' },
    { label: 'Employee', value: 'KatharixEmployee' }
  ];

  // Role change dialog
  showRoleDialog = false;
  roleChangeTarget: SupportHubStaffMember | null = null;
  roleChangeValue = '';
  savingRole = false;

  // Tab
  activeTab: 'staff' | 'invites' = 'staff';

  ngOnInit(): void {
    this.loadStaff();
    this.loadInvites();
  }

  loadStaff(): void {
    this.loadingStaff = true;
    this.dataService.getStaff().subscribe({
      next: (staff) => {
        this.staff = staff;
        this.loadingStaff = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.staff = [];
        this.loadingStaff = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadInvites(): void {
    this.loadingInvites = true;
    this.invitesService.listInvites().subscribe({
      next: (invites) => {
        this.invites = invites.filter(i => !i.redeemedAt);
        this.loadingInvites = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.invites = [];
        this.loadingInvites = false;
        this.cdr.markForCheck();
      },
    });
  }

  createInvite(): void {
    if (this.creatingInvite) return;
    this.creatingInvite = true;
    this.invitesService.createInvite(this.newInviteRole).subscribe({
      next: () => {
        this.loadInvites();
        this.creatingInvite = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.creatingInvite = false;
        this.cdr.markForCheck();
      },
    });
  }

  openRoleDialog(member: SupportHubStaffMember): void {
    this.roleChangeTarget = member;
    this.roleChangeValue = member.role;
    this.showRoleDialog = true;
  }

  saveRole(): void {
    if (!this.roleChangeTarget || this.savingRole) return;
    this.savingRole = true;
    this.dataService.updateStaffRole(this.roleChangeTarget.id, this.roleChangeValue).subscribe({
      next: () => {
        this.showRoleDialog = false;
        this.savingRole = false;
        this.loadStaff();
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingRole = false;
        this.cdr.markForCheck();
      },
    });
  }

  deactivateStaff(member: SupportHubStaffMember): void {
    if (!confirm(`Deactivate ${member.email}? They will lose access.`)) return;
    this.dataService.deactivateStaff(member.id).subscribe({
      next: () => this.loadStaff(),
    });
  }

  displayName(m: SupportHubStaffMember): string {
    const name = [m.firstName, m.lastName].filter(Boolean).join(' ');
    return name || m.email || 'Unknown';
  }

  roleLabel(role: string): string {
    return role === 'KatharixAdmin' ? 'Admin' : 'Employee';
  }

  roleSeverity(role: string): 'info' | 'success' {
    return role === 'KatharixAdmin' ? 'info' : 'success';
  }

  roleSeverityStyles(role: string): string {
    return role === 'KatharixAdmin' ? 'status-chip--info' : 'status-chip--success';
  }

  expiresIn(expiresAt: string): string {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `${days}d left`;
  }

  initials(m: SupportHubStaffMember): string {
    const f = m.firstName?.[0] ?? '';
    const l = m.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || (m.email?.[0]?.toUpperCase() ?? '?');
  }
}
