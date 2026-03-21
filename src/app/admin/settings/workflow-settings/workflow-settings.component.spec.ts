import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { WorkflowSettingsComponent } from './workflow-settings.component';
import { WorkflowSettingsService } from '../services/workflow-settings.service';
import { ScheduleSettingsService } from '../services/schedule-settings.service';
import { ToastService } from '../../../common/toast/toast.service';
import { JobLifecycleStatus } from '../../jobs/models/job';
import { WorkflowStatusDto } from '../models/workflow-status';

describe('WorkflowSettingsComponent', () => {
  let component: WorkflowSettingsComponent;
  let workflowService: jasmine.SpyObj<WorkflowSettingsService>;
  let scheduleService: jasmine.SpyObj<ScheduleSettingsService>;
  let toast: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    workflowService = jasmine.createSpyObj<WorkflowSettingsService>('WorkflowSettingsService', [
      'getJobStatuses',
      'updateJobStatuses'
    ]);
    scheduleService = jasmine.createSpyObj<ScheduleSettingsService>('ScheduleSettingsService', [
      'getScheduleSettings',
      'updateScheduleSettings'
    ]);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);

    const statuses: WorkflowStatusDto[] = [
      { statusKey: JobLifecycleStatus[JobLifecycleStatus.Draft], label: 'Draft', sortOrder: 0 },
      { statusKey: JobLifecycleStatus[JobLifecycleStatus.Approved], label: 'Approved', sortOrder: 1 }
    ];

    workflowService.getJobStatuses.and.returnValue(of(statuses));
    workflowService.updateJobStatuses.and.returnValue(of(statuses));
    scheduleService.getScheduleSettings.and.returnValue(of({
      travelBufferMinutes: 15,
      defaultWindowMinutes: 90,
      enforceTravelBuffer: true,
      autoNotifyReschedule: false
    }));
    scheduleService.updateScheduleSettings.and.returnValue(of({
      travelBufferMinutes: 10,
      defaultWindowMinutes: 60,
      enforceTravelBuffer: false,
      autoNotifyReschedule: true
    }));

    component = new WorkflowSettingsComponent(
      new FormBuilder(),
      workflowService,
      scheduleService,
      toast
    );
    component.ngOnInit();
  });

  it('loads status rows and schedule settings on init', () => {
    expect(component.statusRows.length).toBe(2);
    expect(component.scheduleForm.get('travelBufferMinutes')?.value).toBe(15);
    expect(component.scheduleForm.get('defaultWindowMinutes')?.value).toBe(90);
  });

  it('saves workflow statuses with sort order', () => {
    component.statusRows = [
      { statusKey: JobLifecycleStatus[JobLifecycleStatus.Completed], label: ' Done ', sortOrder: 0 },
      { statusKey: JobLifecycleStatus[JobLifecycleStatus.InProgress], label: 'Active', sortOrder: 1 }
    ];

    component.saveStatuses();

    const [payload] = workflowService.updateJobStatuses.calls.mostRecent().args;
    expect(payload[0].statusKey).toBe(JobLifecycleStatus[JobLifecycleStatus.Completed]);
    expect(payload[0].label).toBe('Done');
    expect(payload[0].sortOrder).toBe(0);
  });

  it('saves schedule settings from the form', () => {
    component.scheduleForm.patchValue({
      travelBufferMinutes: 10,
      defaultWindowMinutes: 60,
      enforceTravelBuffer: false,
      autoNotifyReschedule: true
    });

    component.saveScheduleSettings();

    expect(scheduleService.updateScheduleSettings).toHaveBeenCalledWith({
      travelBufferMinutes: 10,
      defaultWindowMinutes: 60,
      enforceTravelBuffer: false,
      autoNotifyReschedule: true
    });
  });
});
