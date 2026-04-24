import {
   Component,
   inject,
   OnDestroy,
   OnInit,
   TemplateRef,
   ViewChild
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
   JobflowGridCommandClickEventArgs,
   JobflowGridColumn,
   JobflowGridComponent,
   JobflowGridPageSettings,
   JobflowGridSortChangeEvent
} from "../../common/jobflow-grid/jobflow-grid.component";
import {ToastService} from "../../common/toast/toast.service";
import {OrganizationContextService} from "../../services/shared/organization-context.service";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {JobsService} from "./services/jobs.service";
import {getClickHandler} from "../../common/utils/page-action-dispatcher";
import {CreateJobComponent} from "./job-create/job-create.component";
import {formatDateTime} from "../../common/utils/app-formaters";
import {Job, JobLifecycleStatus, JobLifecycleStatusLabels} from "./models/job";
import { WorkflowSettingsService } from "../settings/services/workflow-settings.service";
import { WorkflowStatusDto } from "../settings/models/workflow-status";
import {EmployeeService} from "../employees/services/employee.service";
import {Employee} from "../employees/models/employee";
import {AssignmentsService} from "./services/assignments.service";
import {AssignmentDto} from "./models/assignment";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BehaviorSubject, Subject, Subscription, catchError, debounceTime, distinctUntilChanged, of, switchMap, take } from 'rxjs';
import { Auth } from '@angular/fire/auth';
import { useNotifierHub, NotifierHubHandle } from '../services/useNotifierHub';
import { LucideAngularModule } from 'lucide-angular';
import { NgbOffcanvas, NgbOffcanvasRef } from '@ng-bootstrap/ng-bootstrap';


@Component({
   selector: 'app-job',
   standalone: true,
   imports: [
      CommonModule,
      FormsModule,
      ReactiveFormsModule,
      JobflowGridComponent,
      CreateJobComponent,
      RouterLink,
      TranslateModule,
      LucideAngularModule
   ],
   styleUrls: ['./job.component.scss'],
   templateUrl: './job.component.html'
})
export class JobComponent implements OnInit, OnDestroy {
   private readonly jobPageSize = 50;

   private jobs = inject(JobsService);
   private employeesService = inject(EmployeeService);
   private assignmentsService = inject(AssignmentsService);
   private workflowSettings = inject(WorkflowSettingsService);
   private orgContext = inject(OrganizationContextService);
   private offcanvasService = inject(NgbOffcanvas);
   private router = inject(Router);
   private route = inject(ActivatedRoute);
   private translate = inject(TranslateService);
   private auth = inject(Auth);
   private translateLangSub = this.translate.onLangChange.subscribe(() => this.refreshLabels());
   private notifierHub: NotifierHubHandle | null = null;


   @ViewChild('jobTitleTemplate', {static: true})
   jobTitleTemplate!: TemplateRef<unknown>;

   @ViewChild('actionsTemplate', {static: true})
   actionsTemplate!: TemplateRef<unknown>;

   @ViewChild('statusTemplate', {static: true})
   statusTemplate!: TemplateRef<unknown>;

   @ViewChild('addJobOffcanvas', {static: true})
   addJobOffcanvasTpl!: TemplateRef<unknown>;

   organizationId: string | null = null;
   isDrawerOpen = false;
   editingJob: Job | null = null;
   private activeOffcanvasRef: NgbOffcanvasRef | null = null;
   canAccessDispatch = false;
   private onboardingActionHandled = false;
   private returnToCommandCenter = false;
   private suppressNextDrawerClosedHandler = false;

   items: Job[] = [];
   nextCursor: string | null = null;
   private cursorStack: string[] = [];
   jobsLoading = false;
   totalJobsCount: number | null = null;
   columns: JobflowGridColumn[] = [];
   searchText = '';
   sortBy = 'createdAt';
   sortDirection: 'asc' | 'desc' = 'desc';
   error: string | null = null;
   selectedJob: Job | null = null;

   employees: Employee[] = [];
   selectedStatusFilter = '';
   selectedClientFilter = '';
   selectedAssigneeFilter = '';
   canShareUpdates = false;
   clientOptions: { label: string; value: string }[] = [];
   assigneeOptions: { label: string; value: string }[] = [];
   unscheduledJobs: Job[] = [];
   scheduledJobs: Job[] = [];
   upcomingScheduledJobs: Job[] = [];
   hasUnscheduledJobs = false;
   hasUpcomingScheduledJobs = false;
   totalJobs = 0;
   readonly totalJobs$ = new BehaviorSubject<number>(0);
   inProgressCount = 0;
   completedCount = 0;

   statusOptions: { statusKey: string; label: string; value: JobLifecycleStatus }[] = [];
   statusOptionsReady = false;
   private statusLabelMap: Record<number, string> = { ...JobLifecycleStatusLabels };
   private statusKeyMap: Record<number, string> = {};
   private reverseLabelMap: Record<string, number> = {};
   private readonly searchInput$ = new Subject<string>();
   private readonly loadPage$ = new Subject<string | undefined>();
   private searchInputSub?: Subscription;
   private loadPageSub?: Subscription;
   private orgSub?: Subscription;
   private planSub?: Subscription;
   private routeSub?: Subscription;
   private hasRendered = false;

   previewAssignees = new Set<string>();
   previewAssignment: AssignmentDto | null = null;
   updatingStatus = false;
   updatingAssignees = false;
   private destroyed = false;


   pageSettings: JobflowGridPageSettings = {
      pageSize: 20,
      pageSizes: [10, 20, 50, 100]
   };

   private toast = inject(ToastService);

   headerActions = [] as { key: string; label: string; icon: string; class: string; click: () => void }[];

   ngOnInit(): void {
      this.refreshLabels();

      this.orgSub = this.orgContext.org$.subscribe(org => {
         const previousOrganizationId = this.organizationId;
         this.organizationId = org?.id ?? null;

         if (!this.hasRendered) {
            return;
         }

         if (this.organizationId && this.organizationId !== previousOrganizationId) {
            this.load();
         }
      });

      this.loadPageSub = this.loadPage$
         .pipe(
            switchMap((cursor) => {
               this.jobsLoading = true;
               return this.jobs.getAllJobsPaged({
                  cursor,
                  pageSize: this.jobPageSize,
                  statusKey: this.selectedStatusFilter || undefined,
                  clientId: this.selectedClientFilter || undefined,
                  assigneeId: this.selectedAssigneeFilter || undefined,
                  search: this.searchText || undefined,
                  sortBy: this.sortBy,
                  sortDirection: this.sortDirection
               }).pipe(
                  catchError((e) => {
                     this.jobsLoading = false;
                     this.toast.error(this.translate.instant('admin.jobs.toast.loadFailed'));
                     console.error(e);
                     return of(null);
                  })
               );
            })
         )
         .subscribe(page => {
            this.jobsLoading = false;
            if (!page) {
               return;
            }

            this.items = page.items ?? [];
            this.nextCursor = page.nextCursor ?? null;
            this.totalJobsCount = page.totalCount ?? null;
            this.recomputeDerivedState();
            this.selectDefaultJob();
            this.syncPreviewAssignment();
         });

      this.searchInputSub = this.searchInput$
         .pipe(debounceTime(300), distinctUntilChanged())
         .subscribe(search => {
            this.searchText = search;
            this.load();
         });

      this.routeSub = this.route.queryParamMap.subscribe(params => {
         this.returnToCommandCenter = params.get('returnTo') === 'dashboard-command-center';

         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-job-drawer') return;

         this.openAddJob();
         this.onboardingActionHandled = true;
      });

      setTimeout(() => {
         if (this.destroyed) return;
         this.hasRendered = true;
         setTimeout(() => { if (!this.destroyed) this.loadWorkflowStatuses(); }, 0);
         setTimeout(() => { if (!this.destroyed) this.loadEmployees(); }, 0);
         setTimeout(() => {
            if (this.destroyed) return;
            this.planSub = this.orgContext.hasMinPlan$('Flow').subscribe(canShare => {
               this.canShareUpdates = canShare;
            });
         }, 0);
         setTimeout(() => {
            if (!this.destroyed) {
               this.orgContext.hasMinPlan$('Max').pipe(take(1)).subscribe(hasAccess => {
                  this.canAccessDispatch = hasAccess;
               });
            }
         }, 0);
         setTimeout(() => {
            if (!this.destroyed && this.organizationId) {
               this.load();
            }
         }, 0);
      }, 0);

      this.notifierHub = useNotifierHub(this.auth, {
         onJobStatusChanged: () => { if (!this.updatingStatus) this.load(); },
         onAssignmentChanged: () => this.load(),
      });
      void this.notifierHub.connect();
   }

   ngOnDestroy(): void {
      this.destroyed = true;
      void this.notifierHub?.disconnect();
      this.searchInputSub?.unsubscribe();
      this.loadPageSub?.unsubscribe();
      this.orgSub?.unsubscribe();
      this.planSub?.unsubscribe();
      this.routeSub?.unsubscribe();
      this.translateLangSub?.unsubscribe();
   }

   private loadWorkflowStatuses(): void {
      this.statusOptionsReady = false;
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
               label: status.label || this.getDefaultStatusLabel(status.statusKey),
               value: enumValue
            });
            nextLabelMap[enumValue] = status.label || this.getDefaultStatusLabel(status.statusKey);
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
      this.statusOptionsReady = true;

      const reverse: Record<string, number> = {};
      for (const [enumVal, label] of Object.entries(nextLabelMap)) {
         reverse[label.toLowerCase()] = Number(enumVal);
      }
      this.reverseLabelMap = reverse;

      this.recomputeDerivedState();
   }

   private buildDefaultWorkflowStatuses(): WorkflowStatusDto[] {
      return Object.values(JobLifecycleStatus)
         .filter(value => typeof value === 'number')
         .map(value => value as number)
         .sort((a, b) => a - b)
         .map((value, index) => ({
            statusKey: JobLifecycleStatus[value as JobLifecycleStatus],
            label: this.getDefaultStatusLabel(JobLifecycleStatus[value as JobLifecycleStatus]),
            sortOrder: index
         }));
   }

   private getDefaultStatusLabel(statusKey: string): string {
      const fallback = JobLifecycleStatusLabels[JobLifecycleStatus[statusKey as keyof typeof JobLifecycleStatus]] ?? statusKey;
      const translated = this.translate.instant(`admin.jobs.status.${statusKey.toLowerCase()}`);
      return translated === `admin.jobs.status.${statusKey.toLowerCase()}` ? fallback : translated;
   }

   private buildColumns(): void {

      this.columns = [
         {
            headerText: this.translate.instant('admin.jobs.table.columns.job'),
            width: 220,
            sortField: 'title',
            searchFields: ['title', 'organizationClient.firstName', 'organizationClient.lastName'],
            template: this.jobTitleTemplate
         },
         {
            headerText: this.translate.instant('admin.jobs.table.columns.status'),
            width: 120,
            sortField: 'status',
            template: this.statusTemplate
         },
         {
            field: 'scheduledStart',
            headerText: this.translate.instant('admin.jobs.table.columns.scheduled'),
            width: 160,
            valueAccessor: (_field: string, data: unknown) => {
               const job = data as Job;
               return this.getNextScheduledLabel(job);
            }
         },
         {
            headerText: this.translate.instant('admin.jobs.table.columns.actions'),
            width: 200,
            template: this.actionsTemplate
         }
      ];
   }

   private refreshLabels(): void {
      this.headerActions = [
         {
            key: 'add',
            label: this.translate.instant('admin.jobs.actions.add'),
            icon: 'plus-circle',
            class: 'btn btn-primary px-4 fw-semibold',
            click: getClickHandler('add', this.getActionMap())
         }
      ];

      this.buildColumns();
   }

   private getActionMap() {
      return {
         add: () => this.openAddJob()
      };
   }


   load(): void {
      this.cursorStack = [];
      this.loadJobsPage();
   }

   private loadJobsPage(cursor?: string): void {
      this.loadPage$.next(cursor);
   }

   get canGoBack(): boolean {
      return this.cursorStack.length > 0;
   }

   onNextPage(): void {
      if (!this.nextCursor || this.jobsLoading) return;
      this.cursorStack.push(this.nextCursor);
      this.loadJobsPage(this.nextCursor);
   }

   onPrevPage(): void {
      if (!this.canGoBack || this.jobsLoading) return;
      this.cursorStack.pop();
      const previousCursor = this.cursorStack.length > 0
         ? this.cursorStack[this.cursorStack.length - 1]
         : undefined;
      this.loadJobsPage(previousCursor);
   }

   private loadEmployees(): void {
      this.employeesService.getByOrganization().subscribe({
         next: employees => {
            this.employees = employees ?? [];
            this.recomputeDerivedState();
         },
         error: () => {
            this.employees = [];
            this.recomputeDerivedState();
         }
      });
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
      this.load();
   }

   onFiltersChanged(): void {
      this.load();
   }

   onGridSearchChange(search: string): void {
      this.searchInput$.next(search);
   }

   onGridSortChange(event: JobflowGridSortChangeEvent): void {
      if (!event.field || !event.direction) {
         return;
      }

      this.sortBy = event.field;
      this.sortDirection = event.direction;
      this.load();
   }

   onCommandClick(args: JobflowGridCommandClickEventArgs) {
      const row = args.rowData as unknown as Job;

      switch (args.commandColumn?.type) {
         case 'Edit':
            this.editingJob = row ?? null;
            this.activeOffcanvasRef = this.offcanvasService.open(this.addJobOffcanvasTpl, { position: 'end', panelClass: 'job-create-offcanvas' });
            break;

         case 'Delete':
            // delete flow
            break;
      }
   }

   openAddJob(): void {
      this.editingJob = null;
      this.activeOffcanvasRef = this.offcanvasService.open(this.addJobOffcanvasTpl, { position: 'end', panelClass: 'job-create-offcanvas' });
   }

   closeDrawer(): void {
      this.activeOffcanvasRef?.close();
      this.activeOffcanvasRef = null;
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
               this.recomputeDerivedState();
            }
            this.updatingStatus = false;
         },
         error: () => {
            this.toast.error(this.translate.instant('admin.jobs.toast.statusFailed'));
            this.updatingStatus = false;
         }
      });
   }

   async copyClientUpdatesLink(job: Job | null): Promise<void> {
      if (!job?.id) return;

      const link = `${window.location.origin}/client-hub/jobs/${job.id}/updates`;

      try {
         await navigator.clipboard.writeText(link);
         this.toast.success(this.translate.instant('admin.jobs.toast.linkCopied'));
      } catch {
         this.toast.error(this.translate.instant('admin.jobs.toast.linkCopyFailed'));
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
            this.toast.error(this.translate.instant('admin.jobs.toast.assigneesFailed'));
            this.updatingAssignees = false;
         }
      });
   }

   getClientName(job: Job | null): string {
      if (!job?.organizationClient) return this.translate.instant('admin.jobs.labels.clientTbd');

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
      const rawStatus = job?.lifecycleStatus as unknown;

      if (typeof rawStatus === 'number' && rawStatus in JobLifecycleStatus) {
         return rawStatus as JobLifecycleStatus;
      }

      if (typeof rawStatus === 'string') {
         const enumValue = JobLifecycleStatus[rawStatus as keyof typeof JobLifecycleStatus];
         if (typeof enumValue === 'number' && this.statusLabelMap[enumValue]) {
            return enumValue;
         }

         const byLabel = this.reverseLabelMap[rawStatus.toLowerCase()];
         if (byLabel !== undefined) {
            return byLabel as JobLifecycleStatus;
         }

         if (typeof enumValue === 'number') {
            return enumValue;
         }

         const numericStatus = Number(rawStatus);
         if (!Number.isNaN(numericStatus) && numericStatus in JobLifecycleStatus) {
            return numericStatus as JobLifecycleStatus;
         }
      }

      return null;
   }

   isStatusActive(statusKey: string, label: string): boolean {
      if (!this.selectedJob) return false;
      const raw = this.selectedJob.lifecycleStatus as unknown;
      if (typeof raw === 'string') {
         if (raw === statusKey) return true;
         return raw.toLowerCase() === label.toLowerCase();
      }
      if (typeof raw === 'number') {
         return JobLifecycleStatus[raw] === statusKey;
      }
      return false;
   }

   getStatusChipLabel(job: Job | null | undefined): string {
      const status = this.resolveLifecycleStatus(job);
      if (status !== null) {
         return this.statusLabelMap[status] ?? JobLifecycleStatusLabels[status];
      }

      return this.translate.instant('admin.jobs.labels.missing');
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
         case JobLifecycleStatus.Booked:
            return 'chip-booked';
         default:
            return 'chip-default';
      }
   }

   deleteJob(job: Job): void {
      this.toast.error(
         this.translate.instant('admin.jobs.toast.deleteUnavailable', {
            title: job?.title ?? ''
         }).trim()
      );
   }

   editJob(job: Job): void {
      this.editingJob = job;
      this.activeOffcanvasRef = this.offcanvasService.open(this.addJobOffcanvasTpl, { position: 'end', panelClass: 'job-create-offcanvas' });
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

   private recomputeDerivedState(): void {
      this.totalJobs = this.totalJobsCount ?? this.items.length;
      this.totalJobs$.next(this.totalJobs);
      this.clientOptions = this.buildClientOptions();
      this.assigneeOptions = this.buildAssigneeOptions();

      const filtered = this.applyFlowFilters(this.items);
      this.unscheduledJobs = filtered.filter(job => !job.hasAssignments);
      this.scheduledJobs = filtered.filter(job => job.hasAssignments);
      this.hasUnscheduledJobs = this.unscheduledJobs.length > 0;

      const now = new Date();
      const horizon = new Date();
      horizon.setDate(horizon.getDate() + 7);

      this.upcomingScheduledJobs = this.scheduledJobs
         .map(job => ({
            job,
            nextDate: this.getNextAssignmentStart(job)
         }))
         .filter(item => item.nextDate && item.nextDate >= now && item.nextDate <= horizon)
         .sort((a, b) => (a.nextDate?.getTime() ?? 0) - (b.nextDate?.getTime() ?? 0))
         .map(item => item.job);
      this.hasUpcomingScheduledJobs = this.upcomingScheduledJobs.length > 0;

      this.inProgressCount = this.items.filter(job => this.resolveLifecycleStatus(job) === JobLifecycleStatus.InProgress).length;
      this.completedCount = this.items.filter(job => this.resolveLifecycleStatus(job) === JobLifecycleStatus.Completed).length;
   }

   private buildClientOptions(): { label: string; value: string }[] {
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

   private buildAssigneeOptions(): { label: string; value: string }[] {
      return this.employees
         .filter(employee => employee.isActive)
         .map(employee => ({
            value: employee.id,
            label: `${employee.firstName} ${employee.lastName}`.trim()
         }))
         .sort((a, b) => a.label.localeCompare(b.label));
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
