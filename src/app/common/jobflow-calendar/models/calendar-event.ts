import {ScheduleType} from "../../../admin/jobs/models/assignment";

export interface CalendarEvent {
   Id?: string;
   Subject: string;
   StartTime: Date;
   EndTime: Date;
   IsReadonly?: boolean;

   // JobFlow extensions
   EntityType?: ScheduleType;
   EntityId?: string;
}
