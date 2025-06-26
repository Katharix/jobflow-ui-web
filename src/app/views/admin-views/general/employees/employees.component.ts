import { Component, ViewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { GridComponent, GridModule, PageService, SortService, ToolbarService, EditService } from '@syncfusion/ej2-angular-grids';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [LucideAngularModule, GridModule],
  providers: [PageService, SortService, ToolbarService, EditService],
  templateUrl: './employees.component.html',
  styleUrl: './employees.component.scss'
})
export class EmployeesComponent {
  @ViewChild('employeeGrid') employeeGrid!: GridComponent;

  employees = [
    { id: 1, name: 'Jerry Phillips', email: 'jerry@jobflow.app', role: 'Admin' },
    { id: 2, name: 'Jane Doe', email: 'jane@company.com', role: 'Worker' }
  ];

    onAddEmployeeClick(): void {
    this.employeeGrid.addRecord(); // opens the dialog in "Add" mode
  }

  onInviteClick(): void {
    // Your logic to invite (show modal, dropdown, etc.)
    console.log('Invite clicked');
  }
}
