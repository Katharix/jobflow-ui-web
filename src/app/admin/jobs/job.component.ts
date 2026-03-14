import {
   Component,
   inject,
   OnInit,
   TemplateRef,
   ViewChild
} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {PageHeaderComponent} from "../../views/admin-views/dashboard/page-header/page-header.component";
import {
   JobflowGridCommandClickEventArgs,
   JobflowGridColumn,
   JobflowGridComponent,
   JobflowGridPageSettings
} from "../../common/jobflow-grid/jobflow-grid.component";
import {JobflowDrawerComponent} from "../../common/jobflow-drawer/jobflow-drawer.component";
import {ToastService} from "../../common/toast/toast.service";
import {OrganizationContextService} from "../../services/shared/organization-context.service";
import {ActivatedRoute, Router} from "@angular/router";
import {JobsService} from "./services/jobs.service";
import {getClickHandler} from "../../common/utils/page-action-dispatcher";
import {CreateJobComponent} from "./job-create/job-create.component";
import {formatDateTime, formatPhone} from "../../common/utils/app-formaters";
import {Job, JobLifecycleStatus, JobLifecycleStatusLabels} from "./models/job";


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
      CreateJobComponent
   ],
   styleUrls: ['./job.component.scss'],
   templateUrl: './job.component.html'
})
export class JobComponent implements OnInit {

   @ViewChild('jobTitleTemplate', {static: true})
   jobTitleTemplate!: TemplateRef<any>;

   @ViewChild('actionsTemplate', {static: true})
   actionsTemplate!: TemplateRef<any>;

   @ViewChild('statusTemplate', {static: true})
   statusTemplate!: TemplateRef<any>;

   organizationId: string | null = null;
   isDrawerOpen = false;
   editingJob: any | null = null;
   private onboardingActionHandled = false;

   items: Job[] = [];
   columns: JobflowGridColumn[] = [];
   error: string | null = null;

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

   constructor(
      private jobs: JobsService,
      private orgContext: OrganizationContextService,
      private router: Router,
      private route: ActivatedRoute
   ) {
      this.orgContext.org$.subscribe(org => {
         this.organizationId = org?.id ?? null;
      });
   }

   ngOnInit(): void {
      this.buildColumns();

      if (this.organizationId) {
         this.load();
      }

      this.route.queryParamMap.subscribe(params => {
         if (this.onboardingActionHandled) return;
         if (params.get('onboardingAction') !== 'open-job-drawer') return;

         this.openAddJob();
         this.onboardingActionHandled = true;
      });
   }

   private buildColumns(): void {

      this.columns = [
         {
            headerText: 'Job',
            width: 220,
            template: this.jobTitleTemplate
         },
         {
            headerText: 'Status',
            width: 120,
            template: this.statusTemplate
         },
         {
            field: 'organizationClient.phoneNumber',
            headerText: 'Phone Number',
            width: 160,
            valueAccessor: (_field: string, data: any) =>
               formatPhone(data?.organizationClient?.phoneNumber)
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
         },
         error: e => {
            this.toast.error('Failed to load jobs');
            console.error(e);
         }
      });
   }

   isUnscheduled(job: any): boolean {
      return !job.hasAssignments;
   }

   onCommandClick(args: JobflowGridCommandClickEventArgs) {
      const row = args.rowData;

      switch (args.commandColumn?.type) {
         case 'Edit':
            this.editingJob = row;
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

   scheduleJob(job: any) {
      this.router.navigate([
         '/admin/jobs',
         job.id,
         'schedule'
      ]);
   }

   private resolveLifecycleStatus(job: any): JobLifecycleStatus | null {
      const rawStatus = job?.lifecycleStatus;

      if (typeof rawStatus === 'number' && JobLifecycleStatusLabels[rawStatus as JobLifecycleStatus]) {
         return rawStatus as JobLifecycleStatus;
      }

      if (typeof rawStatus === 'string') {
         const enumValue = JobLifecycleStatus[rawStatus as keyof typeof JobLifecycleStatus];
         if (typeof enumValue === 'number') {
            return enumValue;
         }

         const numericStatus = Number(rawStatus);
         if (!Number.isNaN(numericStatus) && JobLifecycleStatusLabels[numericStatus as JobLifecycleStatus]) {
            return numericStatus as JobLifecycleStatus;
         }
      }

      return null;
   }

   getStatusChipLabel(job: any): string {
      const status = this.resolveLifecycleStatus(job);
      if (status !== null) {
         return JobLifecycleStatusLabels[status];
      }

      return typeof job?.lifecycleStatus === 'string' && job.lifecycleStatus.trim().length > 0
         ? job.lifecycleStatus
         : '—';
   }

   getStatusChipClass(job: any): string {
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

   deleteJob(job: any) {

   }

   editJob(job: any) {

   }

   protected readonly Date = Date;
}
