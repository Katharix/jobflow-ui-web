import { AssignmentDto } from '../../jobs/models/assignment';
import { Employee } from '../../employees/models/employee';

export interface DispatchBoardDto {
  rangeStart: string;
  rangeEnd: string;
  employees: Employee[];
  assignments: AssignmentDto[];
  unscheduledJobs: DispatchUnscheduledJob[];
}

export interface DispatchUnscheduledJob {
  jobId: string;
  jobTitle?: string;
  clientName?: string;
  jobLifecycleStatus: number;
  notes?: string;
}
