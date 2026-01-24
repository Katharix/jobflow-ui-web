import {Component, ViewChild, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LucideAngularModule} from 'lucide-angular';
import {
   GridComponent,
   GridModule,
   PageService,
   SortService,
   ToolbarService,
   EditService,
   FilterService,
   CommandModel,
   CommandColumnService,
   CommandClickEventArgs
} from '@syncfusion/ej2-angular-grids';
import {getClickHandler} from '../../common/utils/page-action-dispatcher';
import {PageHeaderComponent} from '../../views/admin-views/dashboard/page-header/page-header.component';
import {ModalComponent} from '../../views/shared/modal/modal.component';
import {EmployeeFormComponent} from './employee-form/employee-form.component';
import {Employee} from './models/employee';
import {EmployeeService} from './services/employee.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import {OrganizationDto} from '../../models/organization';
import {EmployeeRoleService} from '../employee-roles/services/employee-role.service';
import {ToastService} from '../../common/toast/toast.service';
import {Router} from '@angular/router';
import {EmployeeInviteFormComponent} from "./employee-invite-form/employee-invite-form.component";
import {DeleteConfirmComponent} from "../../views/shared/delete-confirm/delete-confirm-component";

@Component({
   selector: 'app-employees',
   standalone: true,
   imports: [
      CommonModule,
      LucideAngularModule,
      GridModule,
      PageHeaderComponent,
      ModalComponent,
      EmployeeFormComponent,
      EmployeeInviteFormComponent,
      DeleteConfirmComponent
   ],
   providers: [PageService, SortService, ToolbarService, EditService, FilterService, CommandColumnService],
   templateUrl: './employees.component.html',
   styleUrl: './employees.component.scss'
})
export class EmployeesComponent implements OnInit {
   @ViewChild('employeeGrid') employeeGrid!: GridComponent;
   @ViewChild('inviteForm') inviteForm!: EmployeeInviteFormComponent;
   @ViewChild(EmployeeFormComponent) employeeFormComponent!: EmployeeFormComponent;


   organizationId: string | null = null;
   organization!: OrganizationDto;
   showInviteModal = false;
   showAddEmployeeModal = false;
   isEditing = false;
   selectedEmployee?: Employee;
   selectedEmployeeName = '';
   showDeleteModal = false;


   employees: Employee[] = [];
   rolesExist = false;
   checkingRoles = true;

   // --- Header Actions ---
   headerActions = [
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

   // --- Syncfusion command column ---
   public commands: CommandModel[] = [
      {
         type: 'Edit',
         buttonOption: {content: 'Edit', cssClass: 'e-flat e-primary me-2'}
      },
      {
         type: 'Delete',
         buttonOption: {content: 'Delete', cssClass: 'e-flat e-danger'}
      }
   ];


   private employeeService = inject(EmployeeService);
   private organizationContext = inject(OrganizationContextService);
   private employeeRoleService = inject(EmployeeRoleService);
   public toast = inject(ToastService);
   public router = inject(Router);


   constructor() {
      this.organizationContext.org$.subscribe(org => {
         if (org) {
            this.organization = org;
            this.organizationId = org.id ?? null;
         }
      });
   }

   ngOnInit(): void {
      this.checkRolesBeforeLoad();
   }

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
            if (this.employeeGrid) this.employeeGrid.refresh();
         },
         error: (err) => console.error('Error loading employees', err)
      });
   }

   private getActionMap() {
      return {
         invite: () => this.onInviteClick(),
         add: () => this.onAddEmployeeClick()
      };
   }

   fullNameAccessor = (field: string, data: any, column: any) => {
      const first = data.firstName ?? '';
      const last = data.lastName ?? '';
      return `${first} ${last}`.trim();
   };

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
      this.employeeService.employeeExistByEmail(
         employeeData.email!
      )
         .subscribe({
            next: (exists) => {
               if (exists) {
                  this.toast.warning(`${employeeData.email} already exists`, 'Warning');
                  return; // 🚫 DO NOT CONTINUE
               }

               // Only create if it doesn't exist
               this.employeeService.create(employeeData).subscribe({
                  next: () => {
                     this.loadEmployees();
                     this.showAddEmployeeModal = false;
                     this.toast.success('Employee added', 'Success');
                  },
                  error: () => this.toast.error('Failed to add employee', 'Failed')
               });
            },
            error: () =>
               this.toast.error('Failed to check employee email', 'Failed')
         });
   }


   onCommandClick(args: CommandClickEventArgs): void {
      const row = args.rowData as Employee;

      if (args.commandColumn?.type === 'Edit') {
         this.onEditCommandClick(args);
         return;
      }

      if (args.commandColumn?.type === 'Delete') {
         this.onDeleteEmployee(row);
         return;
      }
   }

   onEditCommandClick(args: CommandClickEventArgs): void {
      const rowData = args.rowData as Employee;
      console.log("Employee Data: ", args);
      this.isEditing = true;
      this.selectedEmployee = {...rowData};
      this.showAddEmployeeModal = true;
   }

   onDeleteEmployee(employee: Employee): void {
      if (!employee || !employee.id) return;
      this.selectedEmployee = employee;
      this.selectedEmployeeName = `${employee.firstName} ${employee.lastName}`.trim();
      this.showDeleteModal = true;
      return;

   }

   closeInviteModal() {
      this.showInviteModal = false;
   }

   onInviteSubmit() {
      this.inviteForm.submit(); // call child form method
   }

   onInviteSuccess(invite: any) {
      this.closeInviteModal();
      const name = `${invite.firstName ?? ''} ${invite.lastName ?? ''}`.trim() || 'Employee';
      this.toast.success(`Invite sent to ${name}`, 'Success');
   }

   closeDeleteModal() {
      this.showDeleteModal = false;
      this.selectedEmployee = undefined;
   }

   confirmDelete() {
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

}
