import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {OrganizationContextService} from "../../../services/shared/organization-context.service";
import {JobsService} from "../services/jobs.service";


@Component({
   selector: 'jobflow-job-schedule',
   standalone: true,
   imports: [CommonModule, FormsModule],
   templateUrl: './job-schedule.component.html'
})
export class JobScheduleComponent {
   organizationId: string | null = null;
   jobId!: string;

   scheduledStart = '';
   scheduledEnd = '';

   saving = false;
   error: string | null = null;

   constructor(
      private jobsService: JobsService,
      private orgContext: OrganizationContextService,
      private route: ActivatedRoute,
      private router: Router
   ) {
      this.jobId = this.route.snapshot.paramMap.get('jobId')!;

      this.orgContext.org$.subscribe(org => {
         if (org) {
            this.organizationId = org.id ?? null;
         }
      });
   }

   save(): void {
      if (!this.organizationId || !this.scheduledStart) {
         this.error = 'Start date and time are required.';
         return;
      }

      this.saving = true;
      this.error = null;

      this.jobsService.updateSchedule(this.organizationId, {
         id: this.jobId,
         scheduledStart: this.scheduledStart,
         scheduledEnd: this.scheduledEnd || null
      }).subscribe({
         next: () => this.router.navigate(['/dashboard']),
         error: () => {
            this.saving = false;
            this.error = 'Failed to schedule job.';
         }
      });
   }
}
