import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ScheduleType } from '../models/assignment';
import { RecurrenceRuleUpsertRequest } from '../models/recurrence-rule';
import { WeatherForecastDay } from '../../../models/weather';
import { ScheduleSettingsDto } from '../../settings/models/schedule-settings';

type ScheduleMode = 'OneTime' | 'Recurring';

@Component({
   selector: 'app-job-assignment-form',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, SelectModule, InputNumberModule, DatePickerModule, TextareaModule],
   templateUrl: './job-assignments-form.component.html',
})
export class JobAssignmentFormComponent implements OnInit, OnChanges {
   private fb = inject(FormBuilder);


   scheduleModeOptions = [
      { label: 'One Time', value: 'OneTime' },
      { label: 'Recurring', value: 'Recurring' }
   ];

   scheduleTypeOptions = [
      { label: 'Exact time', value: ScheduleType.Exact },
      { label: 'Time window', value: ScheduleType.Window }
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
   @Input() scheduleSettings: ScheduleSettingsDto | null = null;
   @Input() selectedDayForecast: WeatherForecastDay | null = null;
   @Input() isWeatherLoading = false;
   @Input() addressMissing = false;
   @Input() locationUnavailable = false;
   @Input() weatherLocation = 'Job location';
   @Input() weatherIsApproximate = false;

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

   private readonly nonEmptyArrayValidator: ValidatorFn = (control: AbstractControl) => {
      const value = control.value as unknown;
      return Array.isArray(value) && value.length > 0 ? null : { required: true };
   };

   ngOnInit(): void {
      const defaultWindowMinutes = this.scheduleSettings?.defaultWindowMinutes ?? 120;

      this.form = this.fb.group({
         scheduledStart: [this.scheduledStart, Validators.required],
         scheduledEnd: [this.scheduledEnd, Validators.required],
         notes: [''],

         scheduleType: [ScheduleType.Exact, Validators.required],
         windowMinutes: [defaultWindowMinutes, [Validators.min(15)]],

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

      this.configureRecurrenceValidators();
      this.form.get('scheduleMode')?.valueChanges.subscribe(() => this.configureRecurrenceValidators());
      this.form.get('pattern')?.valueChanges.subscribe(() => this.configureRecurrenceValidators());
      this.form.get('endType')?.valueChanges.subscribe(() => this.configureRecurrenceValidators());

      this.form.get('scheduleType')?.valueChanges.subscribe(() => this.syncWindowEnd());
      this.form.get('scheduledStart')?.valueChanges.subscribe(() => this.syncWindowEnd());
      this.form.get('windowMinutes')?.valueChanges.subscribe(() => this.syncWindowEnd());
      this.syncWindowEnd();
   }

   ngOnChanges(changes: SimpleChanges): void {
      if (!this.form) {
         return;
      }

      if (changes['scheduledStart'] || changes['scheduledEnd']) {
         const start = changes['scheduledStart']?.currentValue ?? this.scheduledStart;
         const end = changes['scheduledEnd']?.currentValue ?? this.scheduledEnd;
         if (start) {
            this.form.get('scheduledStart')?.setValue(start, { emitEvent: false });
         }
         if (end) {
            this.form.get('scheduledEnd')?.setValue(end, { emitEvent: false });
         }
         this.syncWindowEnd();
      }

      if (changes['scheduleSettings']) {
         const nextDefault = this.scheduleSettings?.defaultWindowMinutes;
         if (typeof nextDefault === 'number' && nextDefault > 0) {
            this.form.get('windowMinutes')?.setValue(nextDefault, { emitEvent: false });
            this.syncWindowEnd();
         }
      }
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

      const control = this.form.get('dayOfWeek');
      control?.patchValue(updated);
      control?.markAsTouched();
      control?.updateValueAndValidity();
   }

   onSubmit(): void {
      if (this.form.invalid) return;

      const v = this.form.value;
      const start = new Date(v.scheduledStart);
      const end = new Date(v.scheduledEnd);

      if (end <= start) {
         const endControl = this.form.get('scheduledEnd');
         endControl?.setErrors({ endBeforeStart: true });
         endControl?.markAsTouched();
         return;
      }

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
         scheduledStart: start,
         scheduledEnd: end,
         scheduleType: v.scheduleType,
         notes: v.notes ?? '',
         recurrence,
      });
   }

   private configureRecurrenceValidators(): void {
      const scheduleMode = this.form.get('scheduleMode')?.value as ScheduleMode;
      const pattern = this.form.get('pattern')?.value as RecurrenceRuleUpsertRequest['pattern'];
      const endType = this.form.get('endType')?.value as RecurrenceRuleUpsertRequest['endType'];

      const interval = this.form.get('interval');
      const dayOfWeek = this.form.get('dayOfWeek');
      const dayOfMonth = this.form.get('dayOfMonth');
      const endDate = this.form.get('endDate');
      const occurrenceCount = this.form.get('occurrenceCount');

      if (scheduleMode !== 'Recurring') {
         interval?.clearValidators();
         dayOfWeek?.clearValidators();
         dayOfMonth?.clearValidators();
         endDate?.clearValidators();
         occurrenceCount?.clearValidators();

         interval?.updateValueAndValidity({ emitEvent: false });
         dayOfWeek?.updateValueAndValidity({ emitEvent: false });
         dayOfMonth?.updateValueAndValidity({ emitEvent: false });
         endDate?.updateValueAndValidity({ emitEvent: false });
         occurrenceCount?.updateValueAndValidity({ emitEvent: false });
         return;
      }

      interval?.setValidators([Validators.required, Validators.min(1)]);

      if (pattern === 'Weekly') {
         dayOfWeek?.setValidators([this.nonEmptyArrayValidator]);
         dayOfMonth?.clearValidators();
      } else {
         dayOfMonth?.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
         dayOfWeek?.clearValidators();
      }

      if (endType === 'OnDate') {
         endDate?.setValidators([Validators.required]);
         occurrenceCount?.clearValidators();
      } else if (endType === 'AfterCount') {
         occurrenceCount?.setValidators([Validators.required, Validators.min(1)]);
         endDate?.clearValidators();
      } else {
         endDate?.clearValidators();
         occurrenceCount?.clearValidators();
      }

      interval?.updateValueAndValidity({ emitEvent: false });
      dayOfWeek?.updateValueAndValidity({ emitEvent: false });
      dayOfMonth?.updateValueAndValidity({ emitEvent: false });
      endDate?.updateValueAndValidity({ emitEvent: false });
      occurrenceCount?.updateValueAndValidity({ emitEvent: false });
   }

   protected readonly ScheduleType = ScheduleType;

   get travelBufferMinutes(): number {
      return this.scheduleSettings?.travelBufferMinutes ?? 0;
   }

   private syncWindowEnd(): void {
      if (!this.form) {
         return;
      }

      const scheduleType = this.form.get('scheduleType')?.value as ScheduleType;
      if (scheduleType !== ScheduleType.Window) {
         return;
      }

      const startValue = this.form.get('scheduledStart')?.value;
      if (!startValue) {
         return;
      }

      const start = new Date(startValue);
      const windowMinutes = Number(this.form.get('windowMinutes')?.value ?? 0);
      if (!Number.isFinite(windowMinutes) || windowMinutes <= 0) {
         return;
      }

      const end = new Date(start.getTime() + windowMinutes * 60000);
      this.form.get('scheduledEnd')?.setValue(end, { emitEvent: false });
   }

   get weatherMessage(): string {
      if (this.isWeatherLoading) {
         return 'Loading forecast for the job location...';
      }

      if (this.addressMissing) {
         return 'Add a job address to view the forecast for this date.';
      }

      if (this.locationUnavailable) {
         return 'Forecast unavailable for the job address.';
      }

      if (!this.selectedDayForecast) {
         return 'Forecast not available for the selected date yet.';
      }

      const temps = `${this.selectedDayForecast.highTempF}° / ${this.selectedDayForecast.lowTempF}°`;
      const precip = this.selectedDayForecast.precipitationChance >= 20
         ? ` · ${this.selectedDayForecast.precipitationChance}% rain`
         : '';

      return `${this.selectedDayForecast.condition} — ${temps}${precip}.`;
   }

   get weatherSeverity(): 'clear' | 'warning' {
      if (!this.selectedDayForecast) {
         return 'clear';
      }

      return this.selectedDayForecast.precipitationChance >= 50 ? 'warning' : 'clear';
   }

   get weatherStatusIcon(): string {
      return this.weatherSeverity === 'warning' ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle';
   }

   get weatherStatusClass(): string {
      return this.weatherSeverity === 'warning' ? 'text-warning' : 'text-success';
   }
}