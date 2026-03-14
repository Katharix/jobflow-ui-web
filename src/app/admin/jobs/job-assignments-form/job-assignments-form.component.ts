import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ScheduleType } from '../models/assignment';
import { RecurrenceRuleUpsertRequest } from '../models/recurrence-rule';

type ScheduleMode = 'OneTime' | 'Recurring';

@Component({
   selector: 'job-assignment-form',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, SelectModule, InputNumberModule, DatePickerModule, TextareaModule],
   templateUrl: './job-assignments-form.component.html',
})
export class JobAssignmentFormComponent implements OnInit {

   scheduleModeOptions = [
      { label: 'One Time', value: 'OneTime' },
      { label: 'Recurring', value: 'Recurring' }
   ];

   patternOptions = [
      { label: 'Weekly', value: 'Weekly' },
      { label: 'Monthly', value: 'Monthly' }
   ];

   endTypeOptions = [
      { label: 'Never', value: 'Never' },
      { label: 'On Date', value: 'OnDate' },
      { label: 'After Count', value: 'AfterCount' }
   ];

   @Input() jobId!: string;
   @Input() scheduledStart!: Date;
   @Input() scheduledEnd!: Date;

   @Output() submitted = new EventEmitter<{
      jobId: string;
      scheduledStart: Date;
      scheduledEnd: Date;
      scheduleType: ScheduleType;
      notes?: string;
      recurrence?: RecurrenceRuleUpsertRequest;
   }>();

   weekDays = [
      { name: 'Sun', value: 0 },
      { name: 'Mon', value: 1 },
      { name: 'Tue', value: 2 },
      { name: 'Wed', value: 3 },
      { name: 'Thu', value: 4 },
      { name: 'Fri', value: 5 },
      { name: 'Sat', value: 6 },
   ];

   form!: FormGroup;

   constructor(private fb: FormBuilder) {}

   ngOnInit(): void {
      this.form = this.fb.group({
         scheduledStart: [this.scheduledStart, Validators.required],
         scheduledEnd: [this.scheduledEnd, Validators.required],
         notes: [''],

         scheduleMode: ['OneTime' as ScheduleMode, Validators.required],

         // recurrence fields
         pattern: ['Weekly'],
         interval: [1, [Validators.min(1)]],
         dayOfWeek: [[new Date(this.scheduledStart).getDay()]], // array for weekly
         dayOfMonth: [new Date(this.scheduledStart).getDate()],
         endType: ['Never'],
         endDate: [null],
         occurrenceCount: [null],
      });
   }

   get isRecurring(): boolean {
      return this.form?.get('scheduleMode')?.value === 'Recurring';
   }

   isDaySelected(day: number): boolean {
      const days = this.form.get('dayOfWeek')?.value ?? [];
      return days.includes(day);
   }

   onDayOfWeekChange(day: number, event: Event): void {
      const checked = (event.target as HTMLInputElement).checked;
      const current = this.form.get('dayOfWeek')?.value ?? [];

      const updated = checked
         ? [...current, day].sort((a, b) => a - b)
         : current.filter((d: number) => d !== day);

      this.form.patchValue({ dayOfWeek: updated });
   }

   onSubmit(): void {
      if (this.form.invalid) return;

      const v = this.form.value;
      const recurrence: RecurrenceRuleUpsertRequest | undefined = this.isRecurring
         ? {
            pattern: v.pattern,
            interval: Number(v.interval),
            dayOfWeek: v.pattern === 'Weekly' ? (v.dayOfWeek ?? []) : undefined,
            dayOfMonth: v.pattern === 'Monthly' ? Number(v.dayOfMonth) : undefined,
            startDate: new Date(v.scheduledStart),
            endType: v.endType,
            endDate: v.endType === 'OnDate' && v.endDate ? new Date(v.endDate) : undefined,
            occurrenceCount:
               v.endType === 'AfterCount' && v.occurrenceCount
                  ? Number(v.occurrenceCount)
                  : undefined,
         }
      : undefined;

      this.submitted.emit({
         jobId: this.jobId,
         scheduledStart: new Date(v.scheduledStart),
         scheduledEnd: new Date(v.scheduledEnd),
         scheduleType: ScheduleType.Exact,
         notes: v.notes ?? '',
         recurrence,
      });
   }

   protected readonly ScheduleType = ScheduleType;
}