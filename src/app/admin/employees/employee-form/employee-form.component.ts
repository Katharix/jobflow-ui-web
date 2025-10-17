import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Employee } from '../models/employee';
import { EmployeeRoleService } from '../../employee-roles/services/employee-role.service';
import { EmployeeRole } from '../../employee-roles/models/employee-role';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit {
  @Input() employee?: Employee;
  @Output() submitted = new EventEmitter<Partial<Employee>>();

  form!: FormGroup;

  roles: EmployeeRole[] = [];
  organizationId: string | null = null;
  loadingRoles = false;

  constructor(
    private fb: FormBuilder,
    private employeeRoleService: EmployeeRoleService,
    private organizationContext: OrganizationContextService
  ) { }

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
      phoneNumber: [this.employee?.phoneNumber || ''],
      roleId: [this.employee?.role || '', Validators.required],
      isActive: [this.employee?.isActive ?? true],
      organizationId: [this.organizationId]
    });

  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submitted.emit(this.form.value);
    }
  }

  loadRoles(): void {
    if (!this.organizationId) return;
    this.loadingRoles = true;

    this.employeeRoleService.getByOrganization(this.organizationId).subscribe({
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
