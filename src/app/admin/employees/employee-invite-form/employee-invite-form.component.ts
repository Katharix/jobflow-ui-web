// employee-invite-form.component.ts
import {Component, EventEmitter, inject, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, Validators, ReactiveFormsModule} from '@angular/forms';
import {InputTextModule} from 'primeng/inputtext';
import {SelectModule} from 'primeng/select';
import {EmployeeRoleService} from '../../employee-roles/services/employee-role.service';
import {EmployeeRole} from '../../employee-roles/models/employee-role';
import {OrganizationContextService} from '../../../services/shared/organization-context.service';
import {OrganizationDto} from '../../../models/organization';
import {firstValueFrom} from 'rxjs';
import {EmployeeInviteService} from '../services/employee-invite.service';
import {ToastService} from "../../../common/toast/toast.service";
import {EmployeeService} from "../services/employee.service";

@Component({
   selector: 'app-employee-invite-form',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, InputTextModule, SelectModule],
   templateUrl: './employee-invite-form.component.html'
})
export class EmployeeInviteFormComponent {
   @Output() submitted = new EventEmitter<any>();
   organizationId: string | null = null;
   organization!: OrganizationDto;
   form: FormGroup;
   roles: EmployeeRole[] = [];
   loading = false;
   private organizationContext = inject(OrganizationContextService);
   public toast = inject(ToastService);
   private employeeService = inject(EmployeeService);

   constructor(
      private fb: FormBuilder,
      private inviteService: EmployeeInviteService,
      private roleService: EmployeeRoleService
   ) {

      this.organizationContext.org$.subscribe(org => {
         if (org) {
            this.organization = org;
            this.organizationId = org.id ?? null;
         }
      });
      this.form = this.fb.group({
         firstName: ['', Validators.required],
         lastName: ['', Validators.required],
         email: ['', [Validators.required, Validators.email]],
         phoneNumber: [''],
         roleId: ['', Validators.required]
      });

      this.loadRoles();
   }

   async loadRoles() {
      const roles$ = this.roleService.getByOrganization();
      this.roles = await firstValueFrom(roles$);
   }

   async submit() {
      if (this.form.invalid) return;

      this.loading = true;

      try {
         const payload = {
            ...this.form.value
         };

         // 1. CHECK EMAIL FIRST
         const exists = await firstValueFrom(
            this.employeeService.employeeExistByEmail(
               payload.email
            )
         );

         // 2. STOP if email exists
         if (exists) {
            this.toast.warning(`${payload.email} already exists`, 'Warning');
            return;
         }

         // 3. SEND INVITE IF SAFE
         const result = await firstValueFrom(
            this.inviteService.sendInvite(payload)
         );

         this.submitted.emit(result);

      } catch (err) {
         this.toast.error('Failed to send invite', 'Error');
      } finally {
         this.loading = false;
      }
   }

}
