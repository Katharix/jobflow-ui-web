import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import {
  GridComponent,
  EditSettingsModel,
  GridModule,
  PageService,
  SortService,
  EditService
} from '@syncfusion/ej2-angular-grids';
import { ToastService } from '../../common/toast/toast.service';
import { EmployeeRole } from './models/employee-role';
import { EmployeeRoleService } from './services/employee-role.service';
import { OrganizationContextService } from '../../services/shared/organization-context.service';
import { PageHeaderComponent } from "../../views/admin-views/dashboard/page-header/page-header.component";

@Component({
  selector: 'app-employee-roles',
  standalone: true,
  templateUrl: './employee-roles.component.html',
  styleUrls: ['./employee-roles.component.scss'],
  providers: [PageService, SortService, EditService],
  imports: [GridModule, PageHeaderComponent]
})
export class EmployeeRolesComponent implements OnInit, AfterViewInit {
  private employeeRoleService = inject(EmployeeRoleService);
  private toast = inject(ToastService);
  private organizationContext = inject(OrganizationContextService);

  @ViewChild('grid') grid!: GridComponent;

  public roles: EmployeeRole[] = [];
  public organizationId = '';
  public loading = false;
  private gridReady = false;

  public editSettings: EditSettingsModel = {
    allowEditing: true,
    allowAdding: true,
    allowDeleting: true,
    mode: 'Dialog',
    showDeleteConfirmDialog: true
  };

  public pageSettings = { pageSize: 10 };

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
    this.loadRoles();
  }

  ngAfterViewInit(): void {
    // Ensure we flag the grid as ready after rendering
    setTimeout(() => {
      if (this.grid) {
        this.gridReady = true;
      }
    });
  }

  // ===========================================================
  // 🔹 Add Role Button (works without toolbar)
  // ===========================================================
  onAddRoleClick(): void {
    if (!this.grid) {
      this.toast.error('Grid reference not found.');
      return;
    }

    // Wait a moment to let Syncfusion finish initializing the dialog edit module
    setTimeout(() => {
      if (this.grid && this.grid.editModule) {
        this.grid.editModule.addRecord();
      } else {
        this.toast.error('Grid still initializing. Try again in a moment.');
      }
    }, 200);
  }

  // ===========================================================
  // 🔹 Load Roles
  // ===========================================================
  loadRoles(): void {
    if (!this.organizationId) return;
    this.loading = true;
    this.employeeRoleService.getByOrganization(this.organizationId).subscribe({
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

  // ===========================================================
  // 🔹 CRUD Handlers
  // ===========================================================
  actionBegin(args: any): void {
    if (args.requestType === 'save') {
      const payload: EmployeeRole = {
        id: args.data.id || null,
        name: args.data.name.toUpperCase(),
        organizationId: this.organizationId
      };

      if (args.action === 'add') {
        this.employeeRoleService.create(payload).subscribe({
          next: () => {
            this.toast.success('Role created successfully');
            this.loadRoles();
          },
          error: () => this.toast.error('Failed to create role')
        });
      } else if (args.action === 'edit') {
        this.employeeRoleService.update(payload.id!, payload).subscribe({
          next: () => {
            this.toast.success('Role updated successfully');
            this.loadRoles();
          },
          error: () => this.toast.error('Failed to update role')
        });
      }
    }

    if (args.requestType === 'delete') {
      const id = args.data[0]?.id;
      if (id) {
        this.employeeRoleService.delete(id).subscribe({
          next: () => {
            this.toast.success('Role deleted successfully');
            this.loadRoles();
          },
          error: () => this.toast.error('Failed to delete role')
        });
      }
    }
  }
}
