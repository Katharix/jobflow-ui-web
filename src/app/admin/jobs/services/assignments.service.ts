import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {BaseApiService} from '../../../services/shared/base-api.service';
import {
   AssignmentDto,
   CreateAssignmentRequestDto, ScheduleType,
   UpdateAssignmentScheduleRequestDto,
   UpdateAssignmentStatusRequestDto
} from "../models/assignment";


@Injectable({providedIn: 'root'})
export class AssignmentsService {
   constructor(private api: BaseApiService) {
   }

   getAssignments(start: Date, end: Date) {
      const params = new HttpParams()
         .set('start', start.toISOString())
         .set('end', end.toISOString());

      return this.api.get<AssignmentDto[]>('assignment', params);
   }

   getAssignmentById(id: string) {
      return this.api.get<AssignmentDto>(`assignment/${id}`);
   }

   createAssignment(jobId: string, dto: CreateAssignmentRequestDto) {
      return this.api.post<AssignmentDto>(
         `job/${jobId}/assignments`,
         {
            ...dto,
            scheduledStart: dto.scheduledStart?.toISOString(),
            scheduledEnd: dto.scheduledEnd?.toISOString()
         }
      );
   }


   updateAssignmentSchedule(
      assignmentId: string,
      dto: { scheduledStart: Date; scheduledEnd: Date; scheduleType: ScheduleType }
   ) {
      return this.api.put<AssignmentDto>(
         `assignment/${assignmentId}/schedule`,
         {
            ...dto,
            scheduledStart: dto.scheduledStart?.toISOString(),
            scheduledEnd: dto.scheduledEnd?.toISOString()
         }
      );
   }


   updateAssignmentStatus(
      assignmentId: string,
      dto: UpdateAssignmentStatusRequestDto
   ) {
      return this.api.put<AssignmentDto>(
         `assignment/${assignmentId}/status`,
         dto
      );
   }

   updateAssignmentAssignees(
      assignmentId: string,
      dto: { employeeIds: string[]; leadEmployeeId?: string | null }
   ) {
      return this.api.put<AssignmentDto>(
         `assignment/${assignmentId}/assignees`,
         dto
      );
   }

   updateAssignmentNotes(
      assignmentId: string,
      dto: { notes?: string | null }
   ) {
      return this.api.put<AssignmentDto>(
         `assignment/${assignmentId}/notes`,
         dto
      );
   }
}
