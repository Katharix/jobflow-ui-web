export interface AssignmentDto {
   id: string;

   jobId: string;
   jobTitle: string;
   clientName: string;

   scheduledStart: Date;
   scheduledEnd?: Date;

   actualStart?: string;
   actualEnd?: string;

   scheduleType: ScheduleType;
   status: AssignmentStatus;

   address1?: string;
   city?: string;
   state?: string;
   zipCode?: string;

   notes?: string;

   jobLifecycleStatus?: number;
   statusLabel?: string;
   assignees?: AssignmentAssigneeDto[];
}

export interface AssignmentAssigneeDto {
   employeeId: string;
   employeeName?: string;
   isLead: boolean;
}

export enum ScheduleType {
   'Window' = 1,
   'Exact' = 2
}

export type AssignmentStatus =
   | 'Scheduled'
   | 'InProgress'
   | 'Completed'
   | 'Skipped'
   | 'Canceled';

export interface CreateAssignmentRequestDto {
   scheduledStart: Date;
   scheduledEnd?: Date;

   scheduleType: ScheduleType;

   address1?: string;
   city?: string;
   state?: string;
   zipCode?: string;

   notes?: string;
}

export interface UpdateAssignmentScheduleRequestDto {
   scheduledStart: Date;
   scheduledEnd?: Date;

   scheduleType: ScheduleType;
}

export interface UpdateAssignmentStatusRequestDto {
   status:
      | 'Scheduled'
      | 'InProgress'
      | 'Completed'
      | 'Skipped'
      | 'Canceled';

   actualStart?: Date;
   actualEnd?: Date;
}

