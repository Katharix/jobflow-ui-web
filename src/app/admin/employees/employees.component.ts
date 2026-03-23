import {Component, OnInit, TemplateRef, ViewChild, inject} from '@angular/core';
import {CommonModule, NgClass} from '@angular/common';

import {ActivatedRoute, Router} from '@angular/router';
import {LucideAngularModule} from 'lucide-angular';

import {getClickHandler} from '../../common/utils/page-action-dispatcher';
import {ToastService} from '../../common/toast/toast.service';
import {PageHeaderComponent} from '../dashboard/page-header/page-header.component';
import {DeleteConfirmComponent} from '../../views/shared/delete-confirm/delete-confirm-component';
import {OrganizationDto} from '../../models/organization';
import {OrganizationContextService} from '../../services/shared/organization-context.service';

import {Employee} from './models/employee';
import {EmployeeService} from './services/employee.service';
import {EmployeeRoleService} from '../employee-roles/services/employee-role.service';
import {EmployeeRole} from '../employee-roles/models/employee-role';
import {EmployeeInviteService} from './services/employee-invite.service';
import {EmployeeInvite} from './models/employee-invite';
import {EmployeeFormComponent} from './employee-form/employee-form.component';
import {EmployeeInviteFormComponent} from './employee-invite-form/employee-invite-form.component';
import {
   JobflowGridColumn,
   JobflowGridComponent,
   JobflowGridPageSettings
} from '../../common/jobflow-grid/jobflow-grid.component';
import { JobflowDrawerComponent } from '../../common/jobflow-drawer/jobflow-drawer.component';

@Component({
   selector: 'app-employees',
   standalone: true,
   templateUrl: './employees.component.html',
   styleUrls: ['./employees.component.scss'],
   imports: [
    LucideAngularModule,
      CommonModule,
      NgClass,
    JobflowGridComponent,
    PageHeaderComponent,
   JobflowDrawerComponent,
    EmployeeFormComponent,
    EmployeeInviteFormComponent,
    DeleteConfirmComponent
]
})
export class EmployeesComponent implements OnInit {
   @ViewChild('actionsTemplate', {static: true}) actionsTemplate!: TemplateRef<unknown>;
   @ViewChild('inviteStatusTemplate', {static: true}) inviteStatusTemplate!: TemplateRef<unknown>;
   @ViewChild('inviteForm') inviteForm!: EmployeeInviteFormComponent;
   @ViewChild(EmployeeFormComponent) employeeFormComponent!: EmployeeFormComponent;

   organizationId: string | null = null;
   organization!: OrganizationDto;

   showInviteDrawer = false;
   showAddEmployeeDrawer = false;
   showDeleteDrawer = false;
   isEditing = false;

   selectedEmployee?: Employee;
   selectedEmployeeName = '';

   employees: Employee[] = [];
   invites: EmployeeInvite[] = [];
   roles: EmployeeRole[] = [];
   summary = {
      total: 0,
      active: 0,
      inactive: 0,
      roles: 0
   };
   statusFilters: { key: string; label: string; active?: boolean }[] = [
      { key: 'all', label: 'All' },
      { key: 'active', label: 'Active', active: true },
      { key: 'inactive', label: 'Inactive', active: false }
   ];
   selectedStatusFilter = 'all';
   selectedRoleFilter = 'all';
   columns: JobflowGridColumn[] = [];
   pageSettings: JobflowGridPageSettings = {pageSize: 10, pageSizes: [10, 20, 50]};
   rolesExist = false;
   checkingRoles = true;
   private onboardingActionHandled = false;

   public headerActions = [
      {
         key: 'invite',
         label: 'Invite',
         icon: 'user-plus',
         class: 'btn btn-outline-primary px-4 fw-semibold'
      },
      {
         key: 'add',
         label: 'Add Employee',
         icon: 'plus-circle',
         class: 'btn btn-primary px-4 fw-semibold'
      }
   ].map(action => ({
      ...action,
      click: getClickHandler(action.key, this.getActionMap())
   }));

   private employeeService = inject(EmployeeService);
   private organizationContext = inject(OrganizationContextService);
   private employeeRoleService = inject(EmployeeRoleService);
   private employeeInviteService = inject(EmployeeInviteService);
   public toast = inject(ToastService);
   public router = inject(Router);
   private route = inject(ActivatedRoute);

   constructor() {
      this.organizationContext.org$.subscribe(org => {
         if (org) {
            this.organization = org;
            this.organizationId = org.id ?? null;
         }
      });
   }

   ngOnInit(): void {
      this.columns = [
         {field: 'firstName', headerText: 'Name', valueAccessor: this.fullNameAccessor},
         {field: 'email', headerText: 'Email'},
         {field: 'roleName', headerText: 'Role'},
         {headerText: 'Invite', width: 130, textAlign: 'Center', template: this.inviteStatusTemplate},
         {headerText: 'Actions', width: 180, textAlign: 'Right', template: this.actionsTemplate}
      ];
      this.checkRolesBeforeLoad();

      this.route.queryParamMap.subscribe(params => {
         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-employee-modal') return;

         this.onAddEmployeeClick();
         this.onboardingActionHandled = true;
      });
   }

   fullNameAccessor = (_field: string, data: unknown): string => {
      const employee = data as Employee;
      const first = employee.firstName ?? '';
      const last = employee.lastName ?? '';
      return `${first} ${last}`.trim();
   };

   checkRolesBeforeLoad(): void {
      if (!this.organizationId) return;

      this.checkingRoles = true;
      this.employeeRoleService.getByOrganization().subscribe({
         next: (roles) => {
            this.rolesExist = roles.length > 0;
            this.summary.roles = roles.length;
            this.roles = roles;
            this.checkingRoles = false;

            if (!this.rolesExist) {
               return;
            }

            this.loadEmployees();
            this.loadInvites();
         },
         error: (err) => {
            console.error('Error checking employee roles', err);
            this.checkingRoles = false;
         }
      });
   }

   loadEmployees(): void {
      if (!this.organizationId) return;

      this.employeeService.getByOrganization().subscribe({
         next: (res) => {
            this.employees = res;
            this.updateSummary(res);
         },
         error: (err) => {
            console.error('Error loading employees', err);
         }
      });
   }

   loadInvites(): void {
      this.employeeInviteService.getByOrganization().subscribe({
         next: (invites) => {
            this.invites = invites ?? [];
         },
         error: (err) => {
            console.error('Error loading employee invites', err);
         }
      });
   }

   onInviteClick(): void {
      this.showInviteDrawer = true;
   }

   onAddEmployeeClick(): void {
      if (!this.rolesExist) {
         this.toast.warning('You must create at least one Employee Role before adding employees.');
         return;
      }

      this.isEditing = false;
      this.selectedEmployee = undefined;
      this.showAddEmployeeDrawer = true;
   }

   onEditEmployee(rowData: Employee): void {
      this.isEditing = true;
      this.selectedEmployee = {...rowData};
      this.showAddEmployeeDrawer = true;
   }

   onDeleteEmployee(rowData: Employee): void {
      this.selectedEmployee = rowData;
      this.selectedEmployeeName = `${rowData.firstName ?? ''} ${rowData.lastName ?? ''}`.trim();
      this.showDeleteDrawer = true;
   }

   onModalCancel(): void {
      this.showAddEmployeeDrawer = false;
      this.isEditing = false;
      this.selectedEmployee = undefined;
   }

   onFormSubmit(employeeData: Partial<Employee>): void {
      if (this.isEditing && employeeData.id) {
         this.employeeService.update(employeeData.id, employeeData).subscribe({
            next: () => {
               this.loadEmployees();
               this.showAddEmployeeDrawer = false;
               this.isEditing = false;
               this.toast.success('Employee updated', 'Success');
            },
            error: () => this.toast.error('Failed to update employee', 'Failed')
         });
         return;
      }

      this.employeeService.employeeExistByEmail(employeeData.email!).subscribe({
         next: (exists) => {
            if (exists) {
               this.toast.warning(`${employeeData.email} already exists`, 'Warning');
               return;
            }

            this.employeeService.create(employeeData).subscribe({
               next: () => {
                  this.loadEmployees();
                     this.showAddEmployeeDrawer = false;
                  this.toast.success('Employee added', 'Success');
               },
               error: () => this.toast.error('Failed to add employee', 'Failed')
            });
         },
         error: () => this.toast.error('Failed to check employee email', 'Failed')
      });
   }

   onInviteSubmit(): void {
      this.inviteForm.submit();
   }

   onInviteSuccess(invite: unknown): void {
      this.closeInviteModal();
      const inviteData = invite as { firstName?: string; lastName?: string } | null;
      const name = `${inviteData?.firstName ?? ''} ${inviteData?.lastName ?? ''}`.trim() || 'Employee';
      this.toast.success(`Invite sent to ${name}`, 'Success');
   }

   closeInviteModal(): void {
      this.showInviteDrawer = false;
   }

   closeDeleteModal(): void {
      this.showDeleteDrawer = false;
      this.selectedEmployee = undefined;
   }

   confirmDelete(): void {
      if (!this.selectedEmployee?.id) return;

      this.employeeService.delete(this.selectedEmployee.id).subscribe({
         next: () => {
            this.toast.success('Employee deleted', 'Success');
            this.loadEmployees();
            this.closeDeleteModal();
         },
         error: (err) => {
            console.error(err);
            this.toast.error('Failed to delete employee');
         }
      });
   }

   private getActionMap() {
      return {
         invite: () => this.onInviteClick(),
         add: () => this.onAddEmployeeClick()
      };
   }

   get filteredEmployees(): Employee[] {
      let filtered = this.employees;

      if (this.selectedStatusFilter !== 'all') {
         const target = this.statusFilters.find(filter => filter.key === this.selectedStatusFilter);
         if (typeof target?.active === 'boolean') {
            filtered = filtered.filter(employee => employee.isActive === target.active);
         }
      }

      if (this.selectedRoleFilter !== 'all') {
         filtered = filtered.filter(employee => this.matchesRoleFilter(employee));
      }

      return filtered;
   }

   setStatusFilter(key: string): void {
      this.selectedStatusFilter = key;
   }

   setRoleFilter(roleId: string): void {
      this.selectedRoleFilter = roleId;
   }

   clearFilters(): void {
      this.selectedStatusFilter = 'all';
      this.selectedRoleFilter = 'all';
   }

   get hasActiveFilters(): boolean {
      return this.selectedStatusFilter !== 'all' || this.selectedRoleFilter !== 'all';
   }

   getFilterCount(key: string): number {
      if (key === 'all') {
         return this.summary.total;
      }

      if (key === 'active') {
         return this.summary.active;
      }

      if (key === 'inactive') {
         return this.summary.inactive;
      }

      return 0;
   }

   getInviteStatusLabelForInvite(invite: EmployeeInvite): string {
      if (invite.isRevoked) {
         return 'Revoked';
      }

      if (invite.isAccepted) {
         return 'Accepted';
      }

      const expiresAt = new Date(invite.expiresAt);
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
         return 'Expired';
      }

      return 'Pending';
   }

   getInviteStatusClassForInvite(invite: EmployeeInvite): string {
      if (invite.isRevoked) {
         return 'invite-status--revoked';
      }

      if (invite.isAccepted) {
         return 'invite-status--accepted';
      }

      const expiresAt = new Date(invite.expiresAt);
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
         return 'invite-status--expired';
      }

      return 'invite-status--pending';
   }

   getInviteName(invite: EmployeeInvite): string {
      return invite.name?.trim() || invite.email || 'Employee';
   }

   getInviteRoleName(invite: EmployeeInvite): string {
      return this.getRoleName(invite.roleId);
   }

   getInviteExpiry(invite: EmployeeInvite): string {
      return this.formatDate(invite.expiresAt);
   }

   getRoleName(roleId?: string | null): string {
      if (!roleId) {
         return 'Unknown role';
      }

      const match = this.roles.find(role => role.id === roleId);
      return match?.name ?? 'Unknown role';
   }

   get sortedInvites(): EmployeeInvite[] {
      return [...this.invites].sort((left, right) => {
         const leftDate = this.toTimestamp(left.expiresAt);
         const rightDate = this.toTimestamp(right.expiresAt);
         return rightDate - leftDate;
      });
   }

   getInviteStatusLabel(employee: Employee): string {
      const invite = this.findInviteByEmployee(employee);
      if (!invite) {
         return '—';
      }

      return this.getInviteStatusLabelForInvite(invite);
   }

   getInviteStatusClass(employee: Employee): string {
      const invite = this.findInviteByEmployee(employee);
      if (!invite) {
         return 'invite-status--none';
      }

      return this.getInviteStatusClassForInvite(invite);
   }

   private matchesRoleFilter(employee: Employee): boolean {
      if (this.selectedRoleFilter === 'all') {
         return true;
      }

      const roleId = (employee as Employee & { roleId?: string; roleName?: string }).roleId ?? employee.role;
      if (roleId && roleId === this.selectedRoleFilter) {
         return true;
      }

      const roleName = (employee as Employee & { roleName?: string }).roleName ?? employee.role;
      if (!roleName) {
         return false;
      }

      const selectedRole = this.roles.find(role => role.id === this.selectedRoleFilter);
      return selectedRole?.name === roleName;
   }

   private findInviteByEmployee(employee: Employee): EmployeeInvite | null {
      const email = employee.email?.trim().toLowerCase();
      if (!email) {
         return null;
      }

      return this.invites.find(invite => invite.email?.trim().toLowerCase() === email) ?? null;
   }

   private formatDate(value: string | null | undefined): string {
      if (!value) {
         return '—';
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
         return '—';
      }

      return date.toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric'
      });
   }

   private toTimestamp(value: string | Date | null | undefined): number {
      if (!value) {
         return 0;
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
         return 0;
      }

      return date.getTime();
   }

   private updateSummary(list: Employee[]): void {
      const summary = {
         total: list.length,
         active: 0,
         inactive: 0,
         roles: this.summary.roles
      };

      for (const employee of list) {
         if (employee.isActive) {
            summary.active += 1;
         } else {
            summary.inactive += 1;
         }
      }

      this.summary = summary;
   }
}
