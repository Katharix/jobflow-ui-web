import {OrganizationClient} from "../../../models/invoice";

export interface Job {
   id: string;
   title: string;
   scheduledStart: Date;
   scheduledEnd: Date
   comments?: string;
   organizationClient: OrganizationClient
   lifecycleStatus: JobLifecycleStatus;
   hasAssignments: boolean;
}

export enum JobLifecycleStatus {
   Draft = 0,
   Approved = 1,
   InProgress = 2,
   Completed = 3,
   Cancelled = 4,
   Failed = 5
}

export const JobLifecycleStatusLabels: Record<JobLifecycleStatus, string> = {
   [JobLifecycleStatus.Draft]: 'Draft',
   [JobLifecycleStatus.Approved]: 'Approved',
   [JobLifecycleStatus.InProgress]: 'In Progress',
   [JobLifecycleStatus.Completed]: 'Completed',
   [JobLifecycleStatus.Cancelled]: 'Cancelled',
   [JobLifecycleStatus.Failed]: 'Failed'
};
