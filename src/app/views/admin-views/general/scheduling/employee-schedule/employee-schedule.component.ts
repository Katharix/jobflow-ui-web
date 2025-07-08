import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageHeaderComponent } from "../../../dashboard/page-header/page-header.component";

@Component({
  selector: 'app-employee-schedule',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  templateUrl: './employee-schedule.component.html',
  styleUrl: './employee-schedule.component.scss'
})
export class EmployeeScheduleComponent {

}
