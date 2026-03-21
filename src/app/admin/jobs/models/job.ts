import {OrganizationClient} from "../../../models/invoice";
import {AssignmentDto} from "./assignment";

export interface Job {
   id: string;
   title: string;
   organizationClientId?: string;
   scheduledStart?: Date;
   scheduledEnd?: Date;
   comments?: string;
   organizationClient: OrganizationClient
   lifecycleStatus: JobLifecycleStatus;
   invoicingWorkflow?: InvoicingWorkflow | null;
   hasAssignments: boolean;
   assignments?: AssignmentDto[];
}

export enum InvoicingWorkflow {
   SendInvoice = 0,
   InPerson = 1
}

export const InvoicingWorkflowLabels: Record<InvoicingWorkflow, string> = {
   [InvoicingWorkflow.SendInvoice]: 'Send invoice after completion',
   [InvoicingWorkflow.InPerson]: 'Collect payment in person'
};

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
