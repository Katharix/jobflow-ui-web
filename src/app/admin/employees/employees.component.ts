import {Component, OnInit, TemplateRef, ViewChild, inject} from '@angular/core';

import {ActivatedRoute, Router} from '@angular/router';
import {LucideAngularModule} from 'lucide-angular';

import {getClickHandler} from '../../common/utils/page-action-dispatcher';
import {ToastService} from '../../common/toast/toast.service';
import {PageHeaderComponent} from '../dashboard/page-header/page-header.component';
import {ModalComponent} from '../../views/shared/modal/modal.component';
import {DeleteConfirmComponent} from '../../views/shared/delete-confirm/delete-confirm-component';
import {OrganizationDto} from '../../models/organization';
import {OrganizationContextService} from '../../services/shared/organization-context.service';

import {Employee} from './models/employee';
import {EmployeeService} from './services/employee.service';
import {EmployeeRoleService} from '../employee-roles/services/employee-role.service';
import {EmployeeFormComponent} from './employee-form/employee-form.component';
import {EmployeeInviteFormComponent} from './employee-invite-form/employee-invite-form.component';
import {
   JobflowGridColumn,
   JobflowGridComponent,
   JobflowGridPageSettings
} from '../../common/jobflow-grid/jobflow-grid.component';

@Component({
    selector: 'app-employees',
    templateUrl: './employees.component.html',
    styleUrls: ['./employees.component.scss'],
    imports: [
        LucideAngularModule,
        JobflowGridComponent,
        PageHeaderComponent,
        ModalComponent,
        EmployeeFormComponent,
        EmployeeInviteFormComponent,
        DeleteConfirmComponent
    ]
})
export class EmployeesComponent implements OnInit {
   @ViewChild('actionsTemplate', {static: true}) actionsTemplate!: TemplateRef<unknown>;
   @ViewChild('inviteForm') inviteForm!: EmployeeInviteFormComponent;
   @ViewChild(EmployeeFormComponent) employeeFormComponent!: EmployeeFormComponent;

   organizationId: string | null = null;
   organization!: OrganizationDto;

   showInviteModal = false;
   showAddEmployeeModal = false;
   showDeleteModal = false;
   isEditing = false;

   selectedEmployee?: Employee;
   selectedEmployeeName = '';

   employees: Employee[] = [];
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
            this.checkingRoles = false;

            if (!this.rolesExist) {
               this.toast.warning('No employee roles found. Please create at least one before adding employees.');
               return;
            }

            this.loadEmployees();
         },
         error: (err) => {
            console.error('Error checking employee roles', err);
            this.toast.error('Failed to check employee roles.');
            this.checkingRoles = false;
         }
      });
   }

   loadEmployees(): void {
      if (!this.organizationId) return;

      this.employeeService.getByOrganization().subscribe({
         next: (res) => {
            this.employees = res;
         },
         error: (err) => {
            console.error('Error loading employees', err);
         }
      });
   }

   onInviteClick(): void {
      this.showInviteModal = true;
   }

   onAddEmployeeClick(): void {
      if (!this.rolesExist) {
         this.toast.warning('You must create at least one Employee Role before adding employees.');
         return;
      }

      this.isEditing = false;
      this.selectedEmployee = undefined;
      this.showAddEmployeeModal = true;
   }

   onEditEmployee(rowData: Employee): void {
      this.isEditing = true;
      this.selectedEmployee = {...rowData};
      this.showAddEmployeeModal = true;
   }

   onDeleteEmployee(rowData: Employee): void {
      this.selectedEmployee = rowData;
      this.selectedEmployeeName = `${rowData.firstName ?? ''} ${rowData.lastName ?? ''}`.trim();
      this.showDeleteModal = true;
   }

   onModalCancel(): void {
      this.showAddEmployeeModal = false;
      this.isEditing = false;
      this.selectedEmployee = undefined;
   }

   onFormSubmit(employeeData: Partial<Employee>): void {
      if (this.isEditing && employeeData.id) {
         this.employeeService.update(employeeData.id, employeeData).subscribe({
            next: () => {
               this.loadEmployees();
               this.showAddEmployeeModal = false;
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
                  this.showAddEmployeeModal = false;
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
      this.showInviteModal = false;
   }

   closeDeleteModal(): void {
      this.showDeleteModal = false;
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
}
