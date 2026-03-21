import {
   Component,
   inject,
   OnInit,
   TemplateRef,
   ViewChild
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {PageHeaderComponent} from "../dashboard/page-header/page-header.component";
import {
   JobflowGridCommandClickEventArgs,
   JobflowGridColumn,
   JobflowGridComponent,
   JobflowGridPageSettings
} from "../../common/jobflow-grid/jobflow-grid.component";
import {JobflowDrawerComponent} from "../../common/jobflow-drawer/jobflow-drawer.component";
import {ToastService} from "../../common/toast/toast.service";
import {OrganizationContextService} from "../../services/shared/organization-context.service";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {JobsService} from "./services/jobs.service";
import {getClickHandler} from "../../common/utils/page-action-dispatcher";
import {CreateJobComponent} from "./job-create/job-create.component";
import {formatDateTime, formatPhone} from "../../common/utils/app-formaters";
import {Job, JobLifecycleStatus, JobLifecycleStatusLabels} from "./models/job";
import { WorkflowSettingsService } from "../settings/services/workflow-settings.service";
import { WorkflowStatusDto } from "../settings/models/workflow-status";
import {EmployeeService} from "../employees/services/employee.service";
import {Employee} from "../employees/models/employee";
import {AssignmentsService} from "./services/assignments.service";
import {AssignmentDto} from "./models/assignment";


@Component({
   selector: 'app-job',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      PageHeaderComponent,
      ReactiveFormsModule,
      JobflowGridComponent,
      JobflowDrawerComponent,
      CreateJobComponent,
      RouterLink
   ],
   styleUrls: ['./job.component.scss'],
   templateUrl: './job.component.html'
})
export class JobComponent implements OnInit {
   private jobs = inject(JobsService);
   private employeesService = inject(EmployeeService);
   private assignmentsService = inject(AssignmentsService);
   private workflowSettings = inject(WorkflowSettingsService);
   private orgContext = inject(OrganizationContextService);
   private router = inject(Router);
   private route = inject(ActivatedRoute);


   @ViewChild('jobTitleTemplate', {static: true})
   jobTitleTemplate!: TemplateRef<unknown>;

   @ViewChild('actionsTemplate', {static: true})
   actionsTemplate!: TemplateRef<unknown>;

   @ViewChild('statusTemplate', {static: true})
   statusTemplate!: TemplateRef<unknown>;

   organizationId: string | null = null;
   isDrawerOpen = false;
   editingJob: Job | null = null;
   private onboardingActionHandled = false;
   private returnToCommandCenter = false;
   private suppressNextDrawerClosedHandler = false;

   items: Job[] = [];
   columns: JobflowGridColumn[] = [];
   error: string | null = null;
   selectedJob: Job | null = null;

   employees: Employee[] = [];
   selectedStatusFilter = '';
   selectedClientFilter = '';
   selectedAssigneeFilter = '';
   canShareUpdates = false;

   statusOptions: { statusKey: string; label: string; value: JobLifecycleStatus }[] = [];
   private statusLabelMap: Record<number, string> = { ...JobLifecycleStatusLabels };
   private statusKeyMap: Record<number, string> = {};

   previewAssignees = new Set<string>();
   previewAssignment: AssignmentDto | null = null;
   updatingStatus = false;
   updatingAssignees = false;


   pageSettings: JobflowGridPageSettings = {
      pageSize: 20,
      pageSizes: [10, 20, 50, 100]
   };

   private toast = inject(ToastService);

   headerActions = [
      {
         key: 'add',
         label: 'Add Job',
         icon: 'plus-circle',
         class: 'btn btn-primary px-4 fw-semibold'
      }
   ].map(action => ({
      ...action,
      click: getClickHandler(action.key, this.getActionMap())
   }));

   constructor() {
      this.orgContext.org$.subscribe(org => {
         this.organizationId = org?.id ?? null;
      });
   }

   ngOnInit(): void {
      this.buildColumns();
      this.loadWorkflowStatuses();

      this.orgContext.hasMinPlan$('Flow').subscribe(canShare => {
         this.canShareUpdates = canShare;
      });

      this.loadEmployees();

      if (this.organizationId) {
         this.load();
      }

      this.route.queryParamMap.subscribe(params => {
         this.returnToCommandCenter = params.get('returnTo') === 'dashboard-command-center';

         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-job-drawer') return;

         this.openAddJob();
         this.onboardingActionHandled = true;
      });
   }

   private loadWorkflowStatuses(): void {
      this.workflowSettings.getJobStatuses().subscribe({
         next: (statuses) => this.applyWorkflowStatuses(statuses),
         error: () => this.applyWorkflowStatuses(this.buildDefaultWorkflowStatuses())
      });
   }

   private applyWorkflowStatuses(statuses: WorkflowStatusDto[]): void {
      const nextOptions: { statusKey: string; label: string; value: JobLifecycleStatus }[] = [];
      const nextLabelMap: Record<number, string> = {};
      const nextKeyMap: Record<number, string> = {};

      statuses
         .slice()
         .sort((a, b) => a.sortOrder - b.sortOrder)
         .forEach(status => {
            const enumValue = JobLifecycleStatus[status.statusKey as keyof typeof JobLifecycleStatus];
            if (typeof enumValue !== 'number') {
               return;
            }

            nextOptions.push({
               statusKey: status.statusKey,
               label: status.label,
               value: enumValue
            });
            nextLabelMap[enumValue] = status.label;
            nextKeyMap[enumValue] = status.statusKey;
         });

      if (!nextOptions.length) {
         const fallback = this.buildDefaultWorkflowStatuses();
         this.applyWorkflowStatuses(fallback);
         return;
      }

      this.statusOptions = nextOptions;
      this.statusLabelMap = nextLabelMap;
      this.statusKeyMap = nextKeyMap;
   }

   private buildDefaultWorkflowStatuses(): WorkflowStatusDto[] {
      return Object.values(JobLifecycleStatus)
         .filter(value => typeof value === 'number')
         .map(value => value as number)
         .sort((a, b) => a - b)
         .map((value, index) => ({
            statusKey: JobLifecycleStatus[value as JobLifecycleStatus],
            label: JobLifecycleStatusLabels[value as JobLifecycleStatus],
            sortOrder: index
         }));
   }

   private buildColumns(): void {

      this.columns = [
         {
            headerText: 'Job',
            width: 220,
            sortField: 'title',
            searchFields: ['title', 'organizationClient.firstName', 'organizationClient.lastName'],
            template: this.jobTitleTemplate
         },
         {
            headerText: 'Status',
            width: 120,
            sortField: 'lifecycleStatus',
            template: this.statusTemplate
         },
         {
            field: 'organizationClient.phoneNumber',
            headerText: 'Phone Number',
            width: 160,
            valueAccessor: (_field: string, data: unknown) => {
               const job = data as Job;
               return formatPhone(job?.organizationClient?.phoneNumber);
            }
         },
         {
            headerText: 'Actions',
            width: 200,
            template: this.actionsTemplate
         }
      ];
   }

   private getActionMap() {
      return {
         add: () => this.openAddJob()
      };
   }


   load(): void {
      this.jobs.getAllJobs().subscribe({
         next: list => {
            this.items = list ?? [];
            this.selectDefaultJob();
            this.syncPreviewAssignment();
         },
         error: e => {
            this.toast.error('Failed to load jobs');
            console.error(e);
         }
      });
   }

   private loadEmployees(): void {
      this.employeesService.getByOrganization().subscribe({
         next: employees => {
            this.employees = employees ?? [];
         },
         error: () => {
            this.employees = [];
         }
      });
   }

   get totalJobs(): number {
      return this.items.length;
   }

   get unscheduledJobs(): Job[] {
      return this.applyFlowFilters(this.items.filter(job => !job.hasAssignments));
   }

   get scheduledJobs(): Job[] {
      return this.applyFlowFilters(this.items.filter(job => job.hasAssignments));
   }

   get upcomingScheduledJobs(): Job[] {
      const now = new Date();
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + 7);

      return this.scheduledJobs
         .map(job => ({
            job,
            nextDate: this.getNextAssignmentStart(job)
         }))
         .filter(item => item.nextDate && item.nextDate >= now && item.nextDate <= horizon)
         .sort((a, b) => (a.nextDate?.getTime() ?? 0) - (b.nextDate?.getTime() ?? 0))
         .map(item => item.job);
   }

   get inProgressCount(): number {
      return this.items.filter(job => this.resolveLifecycleStatus(job) === JobLifecycleStatus.InProgress).length;
   }

   get completedCount(): number {
      return this.items.filter(job => this.resolveLifecycleStatus(job) === JobLifecycleStatus.Completed).length;
   }

   isUnscheduled(job: Job): boolean {
      return !job.hasAssignments;
   }

   selectJob(job: Job): void {
      this.selectedJob = job;
      this.syncPreviewAssignment();
   }

   clearFilters(): void {
      this.selectedStatusFilter = '';
      this.selectedClientFilter = '';
      this.selectedAssigneeFilter = '';
      this.selectDefaultJob();
      this.syncPreviewAssignment();
   }

   onFiltersChanged(): void {
      this.selectDefaultJob();
      this.syncPreviewAssignment();
   }

   get clientOptions(): { label: string; value: string }[] {
      const map = new Map<string, string>();
      this.items.forEach(job => {
         const clientId = job.organizationClient?.id ?? job.organizationClientId;
         const name = this.getClientName(job);
         if (clientId && name) {
            map.set(clientId, name);
         }
      });

      return Array.from(map.entries())
         .map(([value, label]) => ({ value, label }))
         .sort((a, b) => a.label.localeCompare(b.label));
   }

   get assigneeOptions(): { label: string; value: string }[] {
      return this.employees
         .filter(employee => employee.isActive)
         .map(employee => ({
            value: employee.id,
            label: `${employee.firstName} ${employee.lastName}`.trim()
         }))
         .sort((a, b) => a.label.localeCompare(b.label));
   }

   onCommandClick(args: JobflowGridCommandClickEventArgs) {
      const row = args.rowData as unknown as Job;

      switch (args.commandColumn?.type) {
         case 'Edit':
            this.editingJob = row ?? null;
            this.isDrawerOpen = true;
            break;

         case 'Delete':
            // delete flow
            break;
      }
   }

   openAddJob(): void {
      this.editingJob = null;
      this.isDrawerOpen = true;
   }

   closeDrawer(): void {
      this.isDrawerOpen = false;
      this.editingJob = null;
   }

   onCreateSaved(): void {
      if (this.returnToCommandCenter) {
         this.suppressNextDrawerClosedHandler = true;
         this.router.navigate(['/admin'], {fragment: 'dashboard-command-center'});
         return;
      }

      this.load();
      this.closeDrawer();
   }

   onCreateCancelled(): void {
      if (this.returnToCommandCenter) {
         this.suppressNextDrawerClosedHandler = true;
         this.router.navigate(['/admin'], {fragment: 'dashboard-command-center'});
         return;
      }

      this.closeDrawer();
   }

   onDrawerClosed(): void {
      if (this.suppressNextDrawerClosedHandler) {
         this.suppressNextDrawerClosedHandler = false;
         return;
      }

      this.closeDrawer();

      if (this.returnToCommandCenter) {
         this.router.navigate(['/admin'], {fragment: 'dashboard-command-center'});
      }
   }

   scheduleJob(job: Job): void {
      this.router.navigate(
         ['/admin/jobs', job.id, 'schedule'],
         {
            queryParams: this.returnToCommandCenter
               ? { returnTo: 'dashboard-command-center' }
               : undefined
         }
      );
   }

   updateJobStatus(status: JobLifecycleStatus): void {
      if (!this.selectedJob || this.updatingStatus) {
         return;
      }

      this.updatingStatus = true;
      this.jobs.updateJobStatus(this.selectedJob.id, status).subscribe({
         next: updated => {
            const index = this.items.findIndex(job => job.id === updated.id);
            if (index >= 0) {
               this.items[index] = {
                  ...this.items[index],
                  lifecycleStatus: updated.lifecycleStatus
               };
               this.selectedJob = this.items[index];
            }
            this.updatingStatus = false;
         },
         error: () => {
            this.toast.error('Failed to update job status');
            this.updatingStatus = false;
         }
      });
   }

   async copyClientUpdatesLink(job: Job | null): Promise<void> {
      if (!job?.id) return;

      const link = `${window.location.origin}/client-hub/jobs/${job.id}/updates`;

      try {
         await navigator.clipboard.writeText(link);
         this.toast.success('Client updates link copied.');
      } catch {
         this.toast.error('Unable to copy the updates link.');
      }
   }

   togglePreviewAssignee(employeeId: string): void {
      if (this.previewAssignees.has(employeeId)) {
         this.previewAssignees.delete(employeeId);
         return;
      }

      this.previewAssignees.add(employeeId);
   }

   savePreviewAssignees(): void {
      if (!this.previewAssignment || this.updatingAssignees) {
         return;
      }

      this.updatingAssignees = true;
      const assignmentId = this.previewAssignment.id;

      this.assignmentsService.updateAssignmentAssignees(assignmentId, {
         employeeIds: Array.from(this.previewAssignees)
      }).subscribe({
         next: () => {
            this.load();
            this.updatingAssignees = false;
         },
         error: () => {
            this.toast.error('Failed to update assignees');
            this.updatingAssignees = false;
         }
      });
   }

   getClientName(job: Job | null): string {
      if (!job?.organizationClient) return 'Client TBD';

      return [job.organizationClient.firstName, job.organizationClient.lastName]
         .filter(Boolean)
         .join(' ');
   }

   getNextScheduledLabel(job: Job): string {
      const nextDate = this.getNextAssignmentStart(job) ?? job.scheduledStart;
      return formatDateTime(nextDate ?? null);
   }

   getNextAssignmentStart(job: Job): Date | null {
      const assignments = job.assignments ?? [];
      if (!assignments.length) return null;

      const next = assignments
         .map(assignment => new Date(assignment.scheduledStart))
         .filter(date => !Number.isNaN(date.getTime()))
         .sort((a, b) => a.getTime() - b.getTime())[0];

      return next ?? null;
   }

   getNextAssignment(job: Job): AssignmentDto | null {
      const assignments = job.assignments ?? [];
      if (!assignments.length) return null;

      return assignments
         .slice()
         .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())[0] ?? null;
   }

   getTimelineMarkers(job: Job): { label: string; date: Date }[] {
      const assignments = job.assignments ?? [];
      return assignments
         .map(assignment => ({
            date: new Date(assignment.scheduledStart),
            label: new Date(assignment.scheduledStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
         }))
         .filter(marker => !Number.isNaN(marker.date.getTime()))
         .sort((a, b) => a.date.getTime() - b.date.getTime())
         .slice(0, 4);
   }

   getTimelineTooltip(date: Date): string {
      if (Number.isNaN(date.getTime())) return '';

      const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timePart = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `${datePart} at ${timePart}`;
   }

   getAssigneeStack(job: Job): string[] {
      const assignment = this.getNextAssignment(job);
      if (!assignment?.assignees?.length) return [];

      return assignment.assignees
         .map(assignee => assignee.employeeName)
         .filter(Boolean)
         .map(name => this.getInitials(name!))
         .slice(0, 3);
   }

   getAssigneeOverflow(job: Job): number {
      const assignment = this.getNextAssignment(job);
      if (!assignment?.assignees?.length) return 0;

      return Math.max(assignment.assignees.length - 3, 0);
   }

   private getInitials(fullName: string): string {
      const parts = fullName.trim().split(' ').filter(Boolean);
      if (!parts.length) return '';
      const first = parts[0][0] ?? '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
      return `${first}${last}`.toUpperCase();
   }

   resolveLifecycleStatus(job: Job | null | undefined): JobLifecycleStatus | null {
      const rawStatus = job?.lifecycleStatus;

      if (typeof rawStatus === 'number' && this.statusLabelMap[rawStatus as JobLifecycleStatus]) {
         return rawStatus as JobLifecycleStatus;
      }

      if (typeof rawStatus === 'string') {
         const enumValue = JobLifecycleStatus[rawStatus as keyof typeof JobLifecycleStatus];
         if (typeof enumValue === 'number') {
            return enumValue;
         }

         const numericStatus = Number(rawStatus);
         if (!Number.isNaN(numericStatus) && this.statusLabelMap[numericStatus as JobLifecycleStatus]) {
            return numericStatus as JobLifecycleStatus;
         }
      }

      return null;
   }

   getStatusChipLabel(job: Job | null | undefined): string {
      const status = this.resolveLifecycleStatus(job);
      if (status !== null) {
         return this.statusLabelMap[status] ?? JobLifecycleStatusLabels[status];
      }

      return '—';
   }

   getStatusChipClass(job: Job | null | undefined): string {
      const status = this.resolveLifecycleStatus(job);

      switch (status) {
         case JobLifecycleStatus.Draft:
            return 'chip-draft';
         case JobLifecycleStatus.Approved:
            return 'chip-approved';
         case JobLifecycleStatus.InProgress:
            return 'chip-inprogress';
         case JobLifecycleStatus.Completed:
            return 'chip-completed';
         case JobLifecycleStatus.Cancelled:
            return 'chip-cancelled';
         case JobLifecycleStatus.Failed:
            return 'chip-failed';
         default:
            return 'chip-default';
      }
   }

   deleteJob(job: Job): void {
      this.toast.error(`Delete not available for job ${job?.title ?? ''}`.trim());
   }

   editJob(job: Job): void {
      this.editingJob = job;
      this.isDrawerOpen = true;
   }

   protected readonly Date = Date;
   protected readonly JobLifecycleStatus = JobLifecycleStatus;

   private selectDefaultJob(): void {
      const filtered = this.applyFlowFilters(this.items);
      if (this.selectedJob && filtered.some(job => job.id === this.selectedJob?.id)) {
         return;
      }

      this.selectedJob = this.unscheduledJobs[0] ?? this.upcomingScheduledJobs[0] ?? filtered[0] ?? null;
   }

   private applyFlowFilters(jobs: Job[]): Job[] {
      return jobs.filter(job => {
         if (this.selectedStatusFilter) {
            const status = this.resolveLifecycleStatus(job);
            if (status === null) return false;
            if (this.statusKeyMap[status] !== this.selectedStatusFilter) return false;
         }

         if (this.selectedClientFilter) {
            const clientId = job.organizationClient?.id ?? job.organizationClientId;
            if (clientId !== this.selectedClientFilter) return false;
         }

         if (this.selectedAssigneeFilter) {
            const assignments = job.assignments ?? [];
            const hasAssignee = assignments.some(assignment =>
               (assignment.assignees ?? []).some(assignee => assignee.employeeId === this.selectedAssigneeFilter)
            );
            if (!hasAssignee) return false;
         }

         return true;
      });
   }

   private syncPreviewAssignment(): void {
      if (!this.selectedJob) {
         this.previewAssignment = null;
         this.previewAssignees = new Set();
         return;
      }

      const next = this.getNextAssignment(this.selectedJob);
      this.previewAssignment = next;
      this.previewAssignees = new Set((next?.assignees ?? []).map(assignee => assignee.employeeId));
   }
}
