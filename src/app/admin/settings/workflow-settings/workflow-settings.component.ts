import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PageHeaderComponent } from '../../dashboard/page-header/page-header.component';
import { WorkflowSettingsService } from '../services/workflow-settings.service';
import { ScheduleSettingsService } from '../services/schedule-settings.service';
import { WorkflowStatusUpsertRequestDto } from '../models/workflow-status';
import { ScheduleSettingsDto } from '../models/schedule-settings';
import { JobLifecycleStatus, JobLifecycleStatusLabels } from '../../jobs/models/job';
import { ToastService } from '../../../common/toast/toast.service';

@Component({
  selector: 'app-workflow-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, InputNumberModule, InputTextModule, PageHeaderComponent],
  templateUrl: './workflow-settings.component.html',
  styleUrl: './workflow-settings.component.scss'
})
export class WorkflowSettingsComponent implements OnInit {
  statusRows: WorkflowStatusUpsertRequestDto[] = [];
  scheduleForm!: FormGroup;
  isSavingStatuses = false;
  isSavingSchedule = false;

  constructor(
    private fb: FormBuilder,
    private workflowSettings: WorkflowSettingsService,
    private scheduleSettings: ScheduleSettingsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.scheduleForm = this.fb.group({
      travelBufferMinutes: [20, [Validators.min(0)]],
      defaultWindowMinutes: [120, [Validators.min(0)]],
      enforceTravelBuffer: [true],
      autoNotifyReschedule: [true]
    });

    this.loadStatuses();
    this.loadScheduleSettings();
  }

  loadStatuses(): void {
    this.workflowSettings.getJobStatuses().subscribe({
      next: (rows) => {
        this.statusRows = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
      },
      error: () => {
        this.statusRows = this.buildDefaultStatuses();
      }
    });
  }

  loadScheduleSettings(): void {
    this.scheduleSettings.getScheduleSettings().subscribe({
      next: (settings) => {
        this.patchScheduleForm(settings);
      },
      error: () => {
        this.patchScheduleForm({
          travelBufferMinutes: 20,
          defaultWindowMinutes: 120,
          enforceTravelBuffer: true,
          autoNotifyReschedule: true
        });
      }
    });
  }

  saveStatuses(): void {
    if (this.isSavingStatuses) {
      return;
    }

    this.isSavingStatuses = true;

    const payload = this.statusRows.map((row, index) => ({
      statusKey: row.statusKey,
      label: row.label?.trim() ?? row.statusKey,
      sortOrder: index
    }));

    this.workflowSettings.updateJobStatuses(payload).subscribe({
      next: (updated) => {
        this.statusRows = [...updated].sort((a, b) => a.sortOrder - b.sortOrder);
        this.isSavingStatuses = false;
        this.toast.success('Workflow statuses saved');
      },
      error: (error) => {
        this.isSavingStatuses = false;
        this.toast.error(error?.error?.description ?? 'Unable to save workflow statuses.');
      }
    });
  }

  saveScheduleSettings(): void {
    if (this.scheduleForm.invalid || this.isSavingSchedule) {
      return;
    }

    this.isSavingSchedule = true;
    const payload: ScheduleSettingsDto = {
      ...this.scheduleForm.value
    };

    this.scheduleSettings.updateScheduleSettings(payload).subscribe({
      next: (settings) => {
        this.patchScheduleForm(settings);
        this.isSavingSchedule = false;
        this.toast.success('Schedule guardrails saved');
      },
      error: (error) => {
        this.isSavingSchedule = false;
        this.toast.error(error?.error?.description ?? 'Unable to save schedule guardrails.');
      }
    });
  }

  resetStatuses(): void {
    this.statusRows = this.buildDefaultStatuses();
  }

  moveStatus(index: number, direction: number): void {
    const target = index + direction;
    if (target < 0 || target >= this.statusRows.length) {
      return;
    }

    const updated = [...this.statusRows];
    const [item] = updated.splice(index, 1);
    updated.splice(target, 0, item);
    this.statusRows = updated.map((row, idx) => ({
      ...row,
      sortOrder: idx
    }));
  }

  private patchScheduleForm(settings: ScheduleSettingsDto): void {
    this.scheduleForm.patchValue({
      travelBufferMinutes: settings.travelBufferMinutes,
      defaultWindowMinutes: settings.defaultWindowMinutes,
      enforceTravelBuffer: settings.enforceTravelBuffer,
      autoNotifyReschedule: settings.autoNotifyReschedule
    }, { emitEvent: false });
  }

  private buildDefaultStatuses(): WorkflowStatusUpsertRequestDto[] {
    return Object.values(JobLifecycleStatus)
      .filter(value => typeof value === 'number')
      .map(value => value as number)
      .sort((a, b) => a - b)
      .map((value, index) => ({
        statusKey: JobLifecycleStatus[value as JobLifecycleStatus],
        label: JobLifecycleStatusLabels[value as JobLifecycleStatus],
        sortOrder: index
      }));
  }
}
