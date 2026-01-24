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
   JobflowGridColumn,
   JobflowGridComponent
} from "../../common/jobflow-grid/jobflow-grid.component";
import {JobflowDrawerComponent} from "../../common/jobflow-drawer/jobflow-drawer.component";
import {ToastService} from "../../common/toast/toast.service";
import {OrganizationContextService} from "../../services/shared/organization-context.service";
import {Router} from "@angular/router";
import {JobsService} from "./services/jobs.service";
import {getClickHandler} from "../../common/utils/page-action-dispatcher";
import {CommandClickEventArgs, PageSettingsModel} from "@syncfusion/ej2-angular-grids";
import {CreateJobComponent} from "./job-create/job-create.component";
import {formatPhone} from "../../common/utils/app-formaters";

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

   organizationId: string | null = null;
   isDrawerOpen = false;
   editingJob: any | null = null;

   items: any[] = [];
   columns: JobflowGridColumn[] = [];
   error: string | null = null;

   pageSettings: PageSettingsModel = {
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
      private router: Router
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
   }

   private buildColumns(): void {
      this.columns = [
         {
            headerText: 'Job',
            width: 220,
            template: this.jobTitleTemplate
         },
         {
            headerText: 'Scheduled',
            width: 160,
            valueAccessor: (_field: string, data: any) =>
               data.scheduledStart
                  ? new Date(data.scheduledStart).toLocaleDateString('en-US', {
                     month: 'short',
                     day: 'numeric',
                     year: 'numeric'
                  })
                  : ''
         },
         {
            field: 'jobStatus.status',
            headerText: 'Status',
            width: 120
         },
         {
            field: 'organizationClient.phoneNumber',
            headerText: 'Phone Number',
            width: 160,
            valueAccessor: (_field: string, data: any) =>
               formatPhone(data?.organizationClient?.phoneNumber)
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

   onCommandClick(args: CommandClickEventArgs) {
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
}
