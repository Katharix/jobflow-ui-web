import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScheduleModule, GroupModel } from '@syncfusion/ej2-angular-schedule';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'jobflow-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, ScheduleModule, LucideAngularModule],
  templateUrl: './jobflow-calendar.component.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./jobflow-calendar.component.scss']

})
export class JobflowCalendarComponent {
  private _selectedDate: Date = new Date();
  private _calendarView: string = 'Week';

  @Input() cssClass = 'jobflow-scheduler';

  @Input() set selectedDate(value: Date) {
    this._selectedDate = value;
    this.selectedDateChange.emit(this._selectedDate);
  }
  get selectedDate(): Date {
    return this._selectedDate;
  }
  @Output() selectedDateChange = new EventEmitter<Date>();

  @Input() set calendarView(value: string) {
    this._calendarView = value;
    this.calendarViewChange.emit(this._calendarView);
  }

  get selectedWeekRange(): string {
  const start = this.getStartOfWeek(this.selectedDate);
  const end = this.getEndOfWeek(this.selectedDate);

  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  const startFormatted = start.toLocaleDateString(undefined, options);
  const endFormatted = end.toLocaleDateString(undefined, {
    ...options,
    ...(sameMonth ? {} : { month: 'short' }),
    ...(sameYear ? {} : { year: 'numeric' }),
  });

  const year = end.getFullYear();

  return `${startFormatted} – ${endFormatted}, ${year}`;
}

private getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  const day = start.getDay(); // Sunday = 0
  start.setDate(start.getDate() - day);
  return start;
}

private getEndOfWeek(date: Date): Date {
  const end = this.getStartOfWeek(date);
  end.setDate(end.getDate() + 6);
  return end;
}

  get calendarView(): string {
    return this._calendarView;
  }
  @Output() calendarViewChange = new EventEmitter<string>();

  @Input() views: string[] = ['Day', 'Week', 'Month'];
  @Input() eventSettings: any = {};
  @Input() height: string = '650px';

  // 🔁 Optional filters and grouping
  @Input() filters: { label: string; value: string }[] = [];
  @Input() selectedFilter: string = '';
  @Output() selectedFilterChange = new EventEmitter<string>();

  @Input() resources: any[] = []; // array of resource definitions (e.g., employees)
  @Input() group: GroupModel | undefined; // Syncfusion group settings

  goPrev() {
    const newDate = new Date(this._selectedDate);
    switch (this._calendarView.toLowerCase()) {
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      default:
        newDate.setDate(newDate.getDate() - 1);
    }
    this.updateDate(newDate);
  }

  goNext() {
    const newDate = new Date(this._selectedDate);
    switch (this._calendarView.toLowerCase()) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      default:
        newDate.setDate(newDate.getDate() + 1);
    }
    this.updateDate(newDate);
  }

  goToday() {
    this.updateDate(new Date());
  }

  setView(view: string) {
    this._calendarView = view;
    this.calendarViewChange.emit(this._calendarView);
  }

 onFilterChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  this.selectedFilter = target.value;
  this.selectedFilterChange.emit(this.selectedFilter);
}


  private updateDate(date: Date) {
    this._selectedDate = date;
    this.selectedDateChange.emit(this._selectedDate);
  }
}
