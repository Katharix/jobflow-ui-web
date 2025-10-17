// employee-invite-form.component.ts
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EmployeeRoleService } from '../../employee-roles/services/employee-role.service';
import { EmployeeRole } from '../../employee-roles/models/employee-role';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import { OrganizationDto } from '../../../models/organization';
import { firstValueFrom } from 'rxjs';
import { EmployeeInviteService } from '../services/employee-invite.service';

@Component({
  selector: 'app-employee-invite-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    const roles$ = this.roleService.getByOrganization(this.organizationId!);
    this.roles = await firstValueFrom(roles$);
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;

    try {
      const payload = { ...this.form.value, organizationId: this.organizationId };
      const result = await firstValueFrom(this.inviteService.sendInvite(payload));
      this.submitted.emit(result);
    } finally {
      this.loading = false;
    }
  }
}
