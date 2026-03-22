import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';

import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {CheckboxModule} from 'primeng/checkbox';
import {Employee} from '../models/employee';
import {EmployeeRoleService} from '../../employee-roles/services/employee-role.service';
import {EmployeeRole} from '../../employee-roles/models/employee-role';
import {OrganizationContextService} from '../../../services/shared/organization-context.service';

@Component({
    selector: 'app-employee-form',
    imports: [ReactiveFormsModule, InputTextModule, SelectModule, CheckboxModule],
    templateUrl: './employee-form.component.html',
    styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit {
   private fb = inject(FormBuilder);
   private employeeRoleService = inject(EmployeeRoleService);
   private organizationContext = inject(OrganizationContextService);

   @Input() employee?: Employee;
   @Output() submitted = new EventEmitter<Partial<Employee>>();

   form!: FormGroup;

   roles: EmployeeRole[] = [];
   organizationId: string | null = null;
   loadingRoles = false;

   ngOnInit(): void {
      this.organizationContext.org$.subscribe(org => {
         if (org) {
            this.organizationId = org.id!;
            this.loadRoles();
         }
      });
      this.form = this.fb.group({
         firstName: [this.employee?.firstName || '', Validators.required],
         lastName: [this.employee?.lastName || '', Validators.required],
         email: [this.employee?.email || '', [Validators.required, Validators.email]],
         phoneNumber: [this.employee?.phoneNumber || '', Validators.required],
         roleId: [this.employee?.role || '', Validators.required],
         isActive: [this.employee?.isActive ?? true],
         organizationId: [this.organizationId],
         id: [this.employee?.id],
      });

   }

   get formGroup() {
      return this.form;
   }

   onSubmit(): void {
      if (this.form.valid) {
         this.submitted.emit(this.form.value);
      }
   }

   loadRoles(): void {
      if (!this.organizationId) return;
      this.loadingRoles = true;

      this.employeeRoleService.getByOrganization().subscribe({
         next: (roles) => {
            this.roles = roles;
            this.loadingRoles = false;
         },
         error: () => {
            console.error('Failed to load roles');
            this.loadingRoles = false;
         }
      });
   }

}
