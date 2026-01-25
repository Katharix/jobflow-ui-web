import {JobLifecycleStatus} from "../enums/job-lifecycle-status";

export const JobLifecycleStatusLabels: Record<JobLifecycleStatus, string> = {
   [JobLifecycleStatus.Draft]: 'Draft',
   [JobLifecycleStatus.Approved]: 'Approved',
   [JobLifecycleStatus.InProgress]: 'In Progress',
   [JobLifecycleStatus.Completed]: 'Completed',
   [JobLifecycleStatus.Cancelled]: 'Cancelled',
   [JobLifecycleStatus.Failed]: 'Failed'
};
