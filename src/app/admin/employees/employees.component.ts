import {Component, OnDestroy, OnInit, TemplateRef, ViewChild, inject, signal} from '@angular/core';
import {CommonModule, NgClass} from '@angular/common';

import {ActivatedRoute, Router} from '@angular/router';
import {LucideAngularModule} from 'lucide-angular';
import {NgbOffcanvas, NgbOffcanvasRef} from '@ng-bootstrap/ng-bootstrap';

import {getClickHandler} from '../../common/utils/page-action-dispatcher';
import {ToastService} from '../../common/toast/toast.service';
import {DeleteConfirmComponent} from '../../views/shared/delete-confirm/delete-confirm-component';
import {OrganizationDto} from '../../models/organization';
import {OrganizationContextService} from '../../services/shared/organization-context.service';

import {Employee} from './models/employee';
import {EmployeeService, EmployeeImportPreviewResponse, EmployeeImportJobStatusResponse} from './services/employee.service';
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
import { ModalComponent } from '../../views/shared/modal/modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription, catchError, interval, of, startWith, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
   selector: 'app-employees',
   standalone: true,
   templateUrl: './employees.component.html',
   styleUrls: ['./employees.component.scss'],
   imports: [
    LucideAngularModule,
      CommonModule,
      NgClass,
      FormsModule,
    JobflowGridComponent,
    EmployeeFormComponent,
    EmployeeInviteFormComponent,
      DeleteConfirmComponent,
      ModalComponent,
      TranslateModule
]
})
export class EmployeesComponent implements OnInit, OnDestroy {
   @ViewChild('actionsTemplate', {static: true}) actionsTemplate!: TemplateRef<unknown>;
   @ViewChild('inviteStatusTemplate', {static: true}) inviteStatusTemplate!: TemplateRef<unknown>;
   @ViewChild('inviteForm') inviteForm!: EmployeeInviteFormComponent;
   @ViewChild(EmployeeFormComponent) employeeFormComponent!: EmployeeFormComponent;
   @ViewChild('addEmployeeOffcanvas') addEmployeeOffcanvasTemplate!: TemplateRef<unknown>;
   @ViewChild('inviteOffcanvas') inviteOffcanvasTemplate!: TemplateRef<unknown>;
   @ViewChild('deleteOffcanvas') deleteOffcanvasTemplate!: TemplateRef<unknown>;

   private offcanvasService = inject(NgbOffcanvas);
   private activeEmployeeRef: NgbOffcanvasRef | null = null;
   private activeInviteRef: NgbOffcanvasRef | null = null;
   private activeDeleteRef: NgbOffcanvasRef | null = null;

   organizationId: string | null = null;
   organization!: OrganizationDto;

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
   checkingRoles = signal(true);
   private onboardingActionHandled = false;

   // Import state
   showImportModal = false;
   selectedImportFile: File | null = null;
   selectedImportFileName = '';
   selectedSourceSystem = 'generic';
   importSystems = [
      {value: 'generic', label: 'Generic CSV'}
   ];
   importPreview: EmployeeImportPreviewResponse | null = null;
   importMappings: Record<string, string | null> = {};
   importLoading = false;
   importError: string | null = null;
   importStatus: EmployeeImportJobStatusResponse | null = null;
   importJobId: string | null = null;
   private importPollSub: Subscription | null = null;

   // Bulk-add state
   showBulkAddModal = false;
   bulkRows: { firstName: string; lastName: string; email: string; phoneNumber: string; roleId: string }[] = [];
   bulkSaving = false;
   bulkError: string | null = null;

   public headerActions = [] as { key: string; label: string; icon: string; class: string; click: () => void }[];

   private employeeService = inject(EmployeeService);
   private organizationContext = inject(OrganizationContextService);
   private employeeRoleService = inject(EmployeeRoleService);
   private employeeInviteService = inject(EmployeeInviteService);
   public toast = inject(ToastService);
   public router = inject(Router);
   private route = inject(ActivatedRoute);
   private translate = inject(TranslateService);
   private translateLangSub?: Subscription;
   private orgSub?: Subscription;
   private queryParamSub?: Subscription;

   ngOnInit(): void {
      this.orgSub = this.organizationContext.org$.subscribe(org => {
         if (org) {
            const previousOrganizationId = this.organizationId;
            this.organization = org;
            this.organizationId = org.id ?? null;

            if (this.organizationId && this.organizationId !== previousOrganizationId) {
               this.checkRolesBeforeLoad();
            }
         } else {
            this.organizationId = null;
            this.rolesExist = false;
            this.checkingRoles.set(false);
         }
      });

      this.refreshLabels();

      this.translateLangSub = this.translate.onLangChange.subscribe(() => this.refreshLabels());

      this.queryParamSub = this.route.queryParamMap.subscribe(params => {
         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-employee-modal') return;

         this.onAddEmployeeClick();
         this.onboardingActionHandled = true;
      });
   }

   ngOnDestroy(): void {
      this.stopImportPolling();
      this.translateLangSub?.unsubscribe();
      this.orgSub?.unsubscribe();
      this.queryParamSub?.unsubscribe();
   }

   private refreshLabels(): void {
      this.columns = [
         {field: 'firstName', headerText: this.translate.instant('admin.employees.table.name'), valueAccessor: this.fullNameAccessor},
         {field: 'email', headerText: this.translate.instant('admin.employees.table.email')},
         {field: 'roleName', headerText: this.translate.instant('admin.employees.table.role')},
         {headerText: this.translate.instant('admin.employees.table.invite'), width: 130, textAlign: 'Center', template: this.inviteStatusTemplate},
         {headerText: this.translate.instant('admin.employees.table.actions'), width: 180, textAlign: 'Right', template: this.actionsTemplate}
      ];

      this.statusFilters = [
         { key: 'all', label: this.translate.instant('admin.employees.filters.all') },
         { key: 'active', label: this.translate.instant('admin.employees.filters.active'), active: true },
         { key: 'inactive', label: this.translate.instant('admin.employees.filters.inactive'), active: false }
      ];

      this.headerActions = [
         {
            key: 'invite',
            label: this.translate.instant('admin.employees.actions.invite'),
            icon: 'user-plus',
            class: 'btn btn-outline-primary px-4 fw-semibold',
            click: getClickHandler('invite', this.getActionMap())
         },
         {
            key: 'add',
            label: this.translate.instant('admin.employees.actions.add'),
            icon: 'plus-circle',
            class: 'btn btn-primary px-4 fw-semibold',
            click: getClickHandler('add', this.getActionMap())
         }
      ];
   }

   fullNameAccessor = (_field: string, data: unknown): string => {
      const employee = data as Employee;
      const first = employee.firstName ?? '';
      const last = employee.lastName ?? '';
      return `${first} ${last}`.trim();
   };

   checkRolesBeforeLoad(): void {
      if (!this.organizationId) {
         this.checkingRoles.set(false);
         return;
      }

      this.checkingRoles.set(true);
      this.employeeRoleService.getByOrganization().subscribe({
         next: (roles) => {
            this.rolesExist = roles.length > 0;
            this.summary.roles = roles.length;
            this.roles = roles;
            this.checkingRoles.set(false);

            if (!this.rolesExist) {
               return;
            }

            this.loadEmployees();
            this.loadInvites();
         },
         error: (err) => {
            console.error('Error checking employee roles', err);
            this.checkingRoles.set(false);
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
      if (this.activeInviteRef) { return; }
      this.activeInviteRef = this.offcanvasService.open(this.inviteOffcanvasTemplate, {
         position: 'end', panelClass: 'jf-drawer-panel', backdrop: true, keyboard: true
      });
      this.activeInviteRef.result.then(
         () => { this.activeInviteRef = null; },
         () => { this.activeInviteRef = null; }
      );
   }

   onAddEmployeeClick(): void {
      if (!this.rolesExist) {
         this.toast.warning(this.translate.instant('admin.employees.toast.rolesRequired'));
         return;
      }

      this.isEditing = false;
      this.selectedEmployee = undefined;
      if (this.activeEmployeeRef) { return; }
      this.activeEmployeeRef = this.offcanvasService.open(this.addEmployeeOffcanvasTemplate, {
         position: 'end', panelClass: 'jf-drawer-panel', backdrop: true, keyboard: true
      });
      this.activeEmployeeRef.result.then(
         () => { this.activeEmployeeRef = null; this.isEditing = false; this.selectedEmployee = undefined; },
         () => { this.activeEmployeeRef = null; this.isEditing = false; this.selectedEmployee = undefined; }
      );
   }

   onEditEmployee(rowData: Employee): void {
      this.isEditing = true;
      this.selectedEmployee = {...rowData};
      if (this.activeEmployeeRef) { return; }
      this.activeEmployeeRef = this.offcanvasService.open(this.addEmployeeOffcanvasTemplate, {
         position: 'end', panelClass: 'jf-drawer-panel', backdrop: true, keyboard: true
      });
      this.activeEmployeeRef.result.then(
         () => { this.activeEmployeeRef = null; this.isEditing = false; this.selectedEmployee = undefined; },
         () => { this.activeEmployeeRef = null; this.isEditing = false; this.selectedEmployee = undefined; }
      );
   }

   onDeleteEmployee(rowData: Employee): void {
      this.selectedEmployee = rowData;
      this.selectedEmployeeName = `${rowData.firstName ?? ''} ${rowData.lastName ?? ''}`.trim();
      if (this.activeDeleteRef) { return; }
      this.activeDeleteRef = this.offcanvasService.open(this.deleteOffcanvasTemplate, {
         position: 'end', panelClass: 'jf-drawer-panel', backdrop: true, keyboard: true
      });
      this.activeDeleteRef.result.then(
         () => { this.activeDeleteRef = null; this.selectedEmployee = undefined; },
         () => { this.activeDeleteRef = null; this.selectedEmployee = undefined; }
      );
   }

   onModalCancel(): void {
      this.activeEmployeeRef?.close();
      this.activeEmployeeRef = null;
      this.isEditing = false;
      this.selectedEmployee = undefined;
   }

   onFormSubmit(employeeData: Partial<Employee>): void {
      if (this.isEditing && employeeData.id) {
         this.employeeService.update(employeeData.id, employeeData).subscribe({
            next: () => {
               this.loadEmployees();
               this.onModalCancel();
               this.toast.success(this.translate.instant('admin.employees.toast.updated'), this.translate.instant('admin.employees.toast.successTitle'));
            },
            error: () => this.toast.error(this.translate.instant('admin.employees.toast.updateFailed'), this.translate.instant('admin.employees.toast.failedTitle'))
         });
         return;
      }

      this.employeeService.employeeExistByEmail(employeeData.email!).subscribe({
         next: (exists) => {
            if (exists) {
               this.toast.warning(
                  this.translate.instant('admin.employees.toast.emailExists', { email: employeeData.email }),
                  this.translate.instant('admin.employees.toast.warningTitle')
               );
               return;
            }

            this.employeeService.create(employeeData).subscribe({
               next: () => {
                  this.loadEmployees();
                     this.onModalCancel();
                  this.toast.success(this.translate.instant('admin.employees.toast.added'), this.translate.instant('admin.employees.toast.successTitle'));
               },
               error: () => this.toast.error(this.translate.instant('admin.employees.toast.addFailed'), this.translate.instant('admin.employees.toast.failedTitle'))
            });
         },
         error: () => this.toast.error(this.translate.instant('admin.employees.toast.checkEmailFailed'), this.translate.instant('admin.employees.toast.failedTitle'))
      });
   }

   onInviteSubmit(): void {
      this.inviteForm.submit();
   }

   onInviteSuccess(invite: unknown): void {
      this.closeInviteModal();
      const inviteData = invite as { firstName?: string; lastName?: string } | null;
      const name = `${inviteData?.firstName ?? ''} ${inviteData?.lastName ?? ''}`.trim() || this.translate.instant('admin.employees.labels.employee');
      this.toast.success(
         this.translate.instant('admin.employees.toast.inviteSent', { name }),
         this.translate.instant('admin.employees.toast.successTitle')
      );
   }

   closeInviteModal(): void {
      this.activeInviteRef?.close();
      this.activeInviteRef = null;
   }

   closeDeleteModal(): void {
      this.activeDeleteRef?.close();
      this.activeDeleteRef = null;
      this.selectedEmployee = undefined;
   }

   confirmDelete(): void {
      if (!this.selectedEmployee?.id) return;

      this.employeeService.delete(this.selectedEmployee.id).subscribe({
         next: () => {
            this.toast.success(this.translate.instant('admin.employees.toast.deleted'), this.translate.instant('admin.employees.toast.successTitle'));
            this.loadEmployees();
            this.closeDeleteModal();
         },
         error: (err) => {
            console.error(err);
            this.toast.error(this.translate.instant('admin.employees.toast.deleteFailed'));
         }
      });
   }

   private getActionMap() {
      return {
         invite: () => this.onInviteClick(),
         add: () => this.onAddEmployeeClick(),
         import: () => this.openImportModal()
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
         return this.translate.instant('admin.employees.inviteStatus.revoked');
      }

      if (invite.isAccepted) {
         return this.translate.instant('admin.employees.inviteStatus.accepted');
      }

      const expiresAt = new Date(invite.expiresAt);
      if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
         return this.translate.instant('admin.employees.inviteStatus.expired');
      }

      return this.translate.instant('admin.employees.inviteStatus.pending');
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
      return invite.name?.trim() || invite.email || this.translate.instant('admin.employees.labels.employee');
   }

   getInviteRoleName(invite: EmployeeInvite): string {
      return this.getRoleName(invite.roleId);
   }

   getInviteExpiry(invite: EmployeeInvite): string {
      return this.formatDate(invite.expiresAt);
   }

   getRoleName(roleId?: string | null): string {
      if (!roleId) {
         return this.translate.instant('admin.employees.labels.unknownRole');
      }

      const match = this.roles.find(role => role.id === roleId);
      return match?.name ?? this.translate.instant('admin.employees.labels.unknownRole');
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
         return employee.userId
            ? this.translate.instant('admin.employees.labels.notNeeded')
            : this.translate.instant('admin.employees.labels.missing');
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

      if (employee.role && employee.role === this.selectedRoleFilter) {
         return true;
      }

      const roleName = employee.roleName ?? employee.role;
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
         return this.translate.instant('admin.employees.labels.missing');
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
         return this.translate.instant('admin.employees.labels.missing');
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

      Promise.resolve().then(() => { this.summary = summary; });
   }

   // --- Import methods ---

   openImportModal(): void {
      this.showImportModal = true;
      this.selectedImportFile = null;
      this.selectedImportFileName = '';
      this.importPreview = null;
      this.importMappings = {};
      this.importError = null;
      this.importLoading = false;
      this.importStatus = null;
      this.importJobId = null;
      this.stopImportPolling();
   }

   closeImportModal2(): void {
      this.showImportModal = false;
      this.stopImportPolling();
   }

   onImportFileSelected(event: Event): void {
      const file = (event.target as HTMLInputElement).files?.[0] ?? null;
      this.selectedImportFile = file;
      this.selectedImportFileName = file?.name ?? '';
      this.importPreview = null;
      this.importMappings = {};
      this.importStatus = null;
      this.importJobId = null;
      this.importError = null;
   }

   loadImportPreview(): void {
      if (!this.selectedImportFile) {
         this.importError = 'Choose a CSV file first.';
         return;
      }

      this.importLoading = true;
      this.importError = null;
      this.importPreview = null;

      this.employeeService.previewEmployeeImport(this.selectedImportFile, this.selectedSourceSystem).subscribe({
         next: response => {
            this.importPreview = response;
            this.importMappings = {...response.suggestedMappings};
            this.importLoading = false;
         },
         error: err => {
            this.importLoading = false;
            this.importError = err?.error ?? 'Failed to preview CSV import. Check your file and try again.';
         }
      });
   }

   startImport(): void {
      if (!this.importPreview?.uploadToken) {
         this.importError = 'Preview your CSV before starting import.';
         return;
      }

      if (!this.hasMappedColumns) {
         this.importError = 'Map at least one column before importing.';
         return;
      }

      this.importLoading = true;
      this.importError = null;

      this.employeeService.startEmployeeImport({
         uploadToken: this.importPreview.uploadToken,
         sourceSystem: this.selectedSourceSystem,
         columnMappings: this.importMappings
      }).subscribe({
         next: response => {
            this.importLoading = false;
            this.importJobId = response.jobId;
            this.beginImportPolling(response.jobId);
         },
         error: err => {
            this.importLoading = false;
            this.importError = err?.error ?? 'Could not start import.';
         }
      });
   }

   onMappingChange(column: string, value: string): void {
      this.importMappings[column] = value;
   }

   get hasMappedColumns(): boolean {
      return Object.values(this.importMappings).some(value => !!value && value !== 'Ignore');
   }

   get importProgressPercent(): number {
      if (!this.importStatus || this.importStatus.totalRows <= 0) {
         return 0;
      }
      return Math.min(100, Math.round((this.importStatus.processedRows / this.importStatus.totalRows) * 100));
   }

   private beginImportPolling(jobId: string): void {
      this.stopImportPolling();

      this.importPollSub = interval(1500)
         .pipe(
            startWith(0),
            switchMap(() => this.employeeService.getEmployeeImportStatus(jobId).pipe(
               catchError(() => of(null))
            ))
         )
         .subscribe(status => {
            if (!status) return;

            this.importStatus = status;

            if (status.status === 'completed') {
               this.stopImportPolling();
               this.importJobId = null;
               this.loadEmployees();
               this.toast.success(`Import completed. ${status.succeededRows} employees imported.`);
            }

            if (status.status === 'failed') {
               this.stopImportPolling();
               this.importJobId = null;
               this.importError = status.errorMessage ?? 'Import failed.';
               this.toast.error(this.importError);
            }
         });
   }

   private stopImportPolling(): void {
      this.importPollSub?.unsubscribe();
      this.importPollSub = null;
   }

   // --- Bulk-add methods ---

   openBulkAddModal(): void {
      this.showBulkAddModal = true;
      this.bulkError = null;
      this.bulkSaving = false;
      this.bulkRows = [this.emptyBulkRow(), this.emptyBulkRow(), this.emptyBulkRow()];
   }

   closeBulkAddModal(): void {
      this.showBulkAddModal = false;
   }

   addBulkRow(): void {
      this.bulkRows = [...this.bulkRows, this.emptyBulkRow()];
   }

   removeBulkRow(index: number): void {
      this.bulkRows = this.bulkRows.filter((_, i) => i !== index);
   }

   submitBulkAdd(): void {
      const valid = this.bulkRows.filter(r => r.firstName.trim() && r.lastName.trim() && r.roleId);
      if (valid.length === 0) {
         this.bulkError = 'At least one row with first name, last name, and role is required.';
         return;
      }

      this.bulkSaving = true;
      this.bulkError = null;

      const payloads = valid.map(r => ({
         firstName: r.firstName.trim(),
         lastName: r.lastName.trim(),
         email: r.email.trim() || undefined,
         phoneNumber: r.phoneNumber.trim() || undefined,
         roleId: r.roleId,
         organizationId: this.organizationId
      }));

      this.employeeService.bulkCreate(payloads as Partial<Employee>[]).subscribe({
         next: () => {
            this.bulkSaving = false;
            this.showBulkAddModal = false;
            this.loadEmployees();
            this.toast.success(
               this.translate.instant('admin.employees.toast.bulkAdded', { count: valid.length }),
               this.translate.instant('admin.employees.toast.successTitle')
            );
         },
         error: () => {
            this.bulkSaving = false;
            this.bulkError = 'Failed to add employees. Please check your entries and try again.';
         }
      });
   }

   private emptyBulkRow() {
      return { firstName: '', lastName: '', email: '', phoneNumber: '', roleId: '' };
   }
}
