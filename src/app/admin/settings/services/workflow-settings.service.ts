import { Injectable } from '@angular/core';
import { BaseApiService } from '../../../services/shared/base-api.service';
import { WorkflowStatusDto, WorkflowStatusUpsertRequestDto } from '../models/workflow-status';

@Injectable({ providedIn: 'root' })
export class WorkflowSettingsService {
  constructor(private api: BaseApiService) {}

  getJobStatuses() {
    return this.api.get<WorkflowStatusDto[]>('workflow-settings/job-statuses');
  }

  updateJobStatuses(statuses: WorkflowStatusUpsertRequestDto[]) {
    return this.api.put<WorkflowStatusDto[]>('workflow-settings/job-statuses', statuses);
  }
}
