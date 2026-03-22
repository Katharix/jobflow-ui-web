import {Component, OnInit, TemplateRef, ViewChild, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {InputTextModule} from 'primeng/inputtext';
import {ActivatedRoute} from '@angular/router';
import {ToastService} from '../../common/toast/toast.service';
import {EmployeeRole} from './models/employee-role';
import {EmployeeRoleService} from './services/employee-role.service';
import {OrganizationContextService} from '../../services/shared/organization-context.service';
import {PageHeaderComponent} from "../dashboard/page-header/page-header.component";
import {ModalComponent} from '../../views/shared/modal/modal.component';
import {
   JobflowGridColumn,
   JobflowGridComponent,
   JobflowGridPageSettings
} from '../../common/jobflow-grid/jobflow-grid.component';

@Component({
    selector: 'app-employee-roles',
    templateUrl: './employee-roles.component.html',
    styleUrls: ['./employee-roles.component.scss'],
    imports: [ReactiveFormsModule, InputTextModule, JobflowGridComponent, PageHeaderComponent, ModalComponent]
})
export class EmployeeRolesComponent implements OnInit {
   private employeeRoleService = inject(EmployeeRoleService);
   private toast = inject(ToastService);
   private organizationContext = inject(OrganizationContextService);
   private formBuilder = inject(FormBuilder);

   @ViewChild('actionsTemplate', {static: true})
   actionsTemplate!: TemplateRef<unknown>;

   public roles: EmployeeRole[] = [];
   columns: JobflowGridColumn[] = [];
   pageSettings: JobflowGridPageSettings = {pageSize: 10, pageSizes: [10, 20, 50]};
   public organizationId = '';
   public loading = false;

   showRoleModal = false;
   editingRoleId: string | null = null;

   roleForm = this.formBuilder.group({
      name: ['', [Validators.required]]
   });

   public headerActions = [
      {
         key: 'add',
         label: 'Add Role',
         icon: 'plus-circle',
         class: 'btn btn-primary px-4 fw-semibold',
         click: () => this.onAddRoleClick()
      }
   ];

   constructor() {
      this.organizationContext.org$.subscribe(org => {
         if (org) this.organizationId = org.id ?? '';
      });
   }

   ngOnInit(): void {
      this.columns = [
         {field: 'name', headerText: 'Role Name', width: 260},
         {headerText: 'Actions', width: 180, textAlign: 'Right', template: this.actionsTemplate}
      ];
      this.loadRoles();
      this.route.queryParamMap.subscribe(params => {
         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-role-modal') return;

         this.onAddRoleClick();
         this.onboardingActionHandled = true;
      });
   }
   private onboardingActionHandled = false;
   private route = inject(ActivatedRoute);

   onAddRoleClick(): void {
      this.editingRoleId = null;
      this.roleForm.reset({name: ''});
      this.showRoleModal = true;
   }

   loadRoles(): void {
      if (!this.organizationId) return;
      this.loading = true;
      this.employeeRoleService.getByOrganization().subscribe({
         next: (data) => {
            this.roles = data;
            this.loading = false;
         },
         error: () => {
            this.toast.error('Failed to load employee roles');
            this.loading = false;
         }
      });
   }

   editRole(role: EmployeeRole): void {
      this.editingRoleId = role.id ?? null;
      this.roleForm.reset({name: role.name ?? ''});
      this.showRoleModal = true;
   }

   closeRoleModal(): void {
      this.showRoleModal = false;
      this.editingRoleId = null;
      this.roleForm.reset({name: ''});
   }

   saveRole(): void {
      if (this.roleForm.invalid) {
         this.roleForm.markAllAsTouched();
         return;
      }

      const payload: EmployeeRole = {
         id: this.editingRoleId ?? undefined,
         name: (this.roleForm.value.name ?? '').toUpperCase()
      };

      if (this.editingRoleId) {
         this.employeeRoleService.update(this.editingRoleId, payload).subscribe({
            next: () => {
               this.toast.success('Role updated successfully');
               this.loadRoles();
               this.closeRoleModal();
            },
            error: () => this.toast.error('Failed to update role')
         });
         return;
      }

      this.employeeRoleService.create(payload).subscribe({
         next: () => {
            this.toast.success('Role created successfully');
            this.loadRoles();
            this.closeRoleModal();
         },
         error: () => this.toast.error('Failed to create role')
      });
   }

   deleteRole(role: EmployeeRole): void {
      if (!role.id) return;
      if (!confirm(`Delete role "${role.name}"?`)) return;

      this.employeeRoleService.delete(role.id).subscribe({
         next: () => {
            this.toast.success('Role deleted successfully');
            this.loadRoles();
         },
         error: () => this.toast.error('Failed to delete role')
      });
   }
}
