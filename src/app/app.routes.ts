import {Routes} from '@angular/router';
import {PublicLayoutComponent} from './layouts/public-layout/public-layout.component';
import {AdminLayoutComponent} from './layouts/admin-layout/admin-layout.component';
import {HomeComponent} from './views/home/home.component';
import {authGuard} from './services/auth.guard';
import {DashboardComponent} from './views/admin-views/dashboard/dashboard.component';
import {SubscribeComponent} from './views/subscription-views/subscribe/subscribe.component';
import {AuthLayoutComponent} from './layouts/auth-layout/auth-layout.component';
import {InvoiceComponent} from './views/general/invoice/invoice.component';
import {GeneralLayoutComponent} from './layouts/general-layout/general-layout.component';
import {OnboardingChecklistComponent} from './views/general/onboarding-checklist/onboarding-checklist.component';
import {BrandingComponent} from './admin/branding/branding.component';
import {ChatComponent} from './admin/chat/chat.component';
import {CompanyComponent} from './admin/company/company.component';
import {EmployeesComponent} from './admin/employees/employees.component';
import {PriceBookComponent} from './admin/pricebook/pricebook.component';
import {EmployeeScheduleComponent} from './admin/scheduling/employee-schedule/employee-schedule.component';
import {JobScheduleComponent} from './admin/jobs/job-schedule/job-schedule.component';
import {PriceBookItemComponent} from './admin/pricebook/price-book-item/price-book-item.component';
import {EmployeeRolesComponent} from './admin/employee-roles/employee-roles.component';
import {CustomerComponent} from "./admin/customer/customer.component";
import {CreateJobComponent} from "./admin/jobs/job-create/job-create.component";
import {JobInvoiceComponent} from "./admin/jobs/job-invoice/job-invoice.component";
import {
   ConnectPaymentComponent
} from "./views/general/onboarding-checklist/onboarding-steps/connect-payment/connect-payment.component";


export const routes: Routes = [
   {
      path: '',
      component: PublicLayoutComponent,
      children: [
         {path: '', component: HomeComponent}
      ]
   },
   {path: 'i', loadChildren: () => import('./views/general/invite-accept/invite.routes').then(m => m.INVITE_ROUTES)},

   {
      path: 'admin',
      component: AdminLayoutComponent,
      canActivate: [authGuard,],
      children: [
         {path: '', component: DashboardComponent},
         {path: 'settings/branding', component: BrandingComponent},
         {path: 'messaging', component: ChatComponent},
         {path: 'company', component: CompanyComponent},
         {path: 'employees', component: EmployeesComponent},
         {path: 'scheduling-jobs', component: JobScheduleComponent},
         {path: 'employees/scheduling-employees', component: EmployeeScheduleComponent},
         {path: 'employees/roles', component: EmployeeRolesComponent},
         {path: 'pricebook', component: PriceBookComponent},
         {
            path: 'pricebook/items/category/:categoryId',
            loadComponent: () =>
               import('./admin/pricebook/price-book-item/price-book-item.component')
                  .then(m => m.PriceBookItemComponent)
         },
         {
            path: 'clients/create',
            component: CustomerComponent
         },
         {
            path: 'jobs/create',
            component: CreateJobComponent
         },
         {
            path: 'jobs/:jobId/schedule',
            component: JobScheduleComponent
         },
         {
            path: 'jobs/:jobId/invoice',
            component: JobInvoiceComponent
         },
         {
            path: 'connectedpayment',
            component: ConnectPaymentComponent
         }
      ]
   },
   {
      path: 'onboarding',
      component: AdminLayoutComponent, // ✅ still use admin layout
      children: [
         {
            path: '',
            component: OnboardingChecklistComponent
         }
      ]
   },
   {
      path: 'auth',
      loadChildren: () => import('./auth/auth.routes')
   },
   {
      path: 'subscribe',
      component: AuthLayoutComponent,
      children: [
         {path: '', component: SubscribeComponent},
      ]
   },
   {
      path: 'invoice/view/:id',
      component: GeneralLayoutComponent,
      children: [
         {path: '', component: InvoiceComponent},
      ]
   }
];

