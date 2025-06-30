import { Component, ViewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { GridComponent, GridModule, PageService, SortService, ToolbarService, EditService, FilterService } from '@syncfusion/ej2-angular-grids';
import { CommonModule } from '@angular/common';
import { getClickHandler } from '../../../../common/utils/page-action-dispatcher';
import { PageHeaderComponent } from "../../dashboard/page-header/page-header.component";

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [LucideAngularModule, GridModule, CommonModule, PageHeaderComponent],
  providers: [PageService, SortService, ToolbarService, EditService, FilterService],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent {
  @ViewChild('employeeGrid') employeeGrid!: GridComponent;

  employees = [
    { id: 1, name: 'Jerry Phillips', email: 'jerry@jobflow.app', role: 'Admin' },
    { id: 2, name: 'Jane Doe', email: 'jane@company.com', role: 'Worker' }
  ];

  roles = ['Admin', 'Manager', 'Worker'];
  statuses = ['Active', 'Invited', 'Inactive'];

    headerActions = [
    {
      key: 'invite',
      label: 'Invite',
      icon: 'user-plus',
      class: 'btn btn-outline-primary px-4 fw-semibold',
    },
    {
      key: 'add',
      label: 'Add Employee',
      icon: 'plus-circle',
      class: 'btn btn-primary px-4 fw-semibold',
    }
  ].map(action => ({
    ...action,
    click: getClickHandler(action.key, this.getActionMap())
  }));

  private getActionMap() {
    return {
      invite: () => this.onInviteClick(),
      add: () => this.onAddEmployeeClick()
    };
  }

  onSearch(query: string) {
    this.employeeGrid.search(query);
  }

  onRoleFilter(role: string) {
    if (role) {
      this.employeeGrid.filterByColumn('role', 'equal', role);
    } else {
      this.employeeGrid.removeFilteredColsByField('role');
    }
  }

  onStatusFilter(status: string) {
    if (status) {
      this.employeeGrid.filterByColumn('status', 'equal', status);
    } else {
      this.employeeGrid.removeFilteredColsByField('status');
    }
  }


  onAddEmployeeClick(): void {
    this.employeeGrid.addRecord(); // opens the dialog in "Add" mode
  }

  onInviteClick(): void {
    // Your logic to invite (show modal, dropdown, etc.)
    console.log('Invite clicked');
  }
}
