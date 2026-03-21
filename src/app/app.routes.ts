import {Routes} from '@angular/router';
import {PublicLayoutComponent} from './layouts/public-layout/public-layout.component';
import {AdminLayoutComponent} from './layouts/admin-layout/admin-layout.component';
import {HomeComponent} from './views/home/home.component';
import {authGuard} from './core/guards/auth.guard';
import {subscriptionGuard} from './core/guards/subscription.guard';
import {DashboardComponent} from './admin/dashboard/dashboard.component';
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
import {JobInvoiceComponent} from "./admin/jobs/job-invoice/job-invoice.component";
import {
   ConnectPaymentComponent
} from "./views/general/onboarding-checklist/onboarding-steps/connect-payment/connect-payment.component";
import {JobComponent} from "./admin/jobs/job.component";
import {InvoicesComponent} from "./admin/invoices/invoices.component";
import {HelpComponent} from "./admin/help/help.component";
import {EstimatesComponent} from "./admin/estimates/estimates.component";
import {EstimateComponent} from "./views/general/estimate/estimate.component";
import {NotFoundComponent} from "./views/general/not-found/not-found.component";
import {TermsComponent} from "./views/general/terms/terms.component";
import {PrivacyComponent} from "./views/general/privacy/privacy.component";
import {BillingPaymentsComponent} from './admin/billing-payments/billing-payments.component';
import { DispatchComponent } from './admin/dispatch/dispatch.component';
import { WorkflowSettingsComponent } from './admin/settings/workflow-settings/workflow-settings.component';


export const routes: Routes = [
   {
      path: '',
      component: PublicLayoutComponent,
      children: [
         {path: '', component: HomeComponent},
         {path: 'terms', component: TermsComponent},
         {path: 'privacy', component: PrivacyComponent}
      ]
   },
   {path: 'i', loadChildren: () => import('./views/general/invite-accept/invite.routes').then(m => m.INVITE_ROUTES)},

   {
      path: 'admin',
      component: AdminLayoutComponent,
      canActivate: [authGuard],
      children: [
         {path: '', component: DashboardComponent},
         {path: 'settings/branding', component: BrandingComponent},
         {path: 'settings/workflow', component: WorkflowSettingsComponent, canActivate: [subscriptionGuard], data: {minPlan: 'Flow'}},
         {path: 'messaging', component: ChatComponent},
         {path: 'company', component: CompanyComponent},

         {path: 'employees', component: EmployeesComponent, canActivate: [subscriptionGuard], data: {minPlan: 'Flow'}},
         {path: 'employees/scheduling-employees', component: EmployeeScheduleComponent, canActivate: [subscriptionGuard], data: {minPlan: 'Flow'}},
         {path: 'employees/roles', component: EmployeeRolesComponent, canActivate: [subscriptionGuard], data: {minPlan: 'Flow'}},

         {path: 'scheduling-jobs', component: JobScheduleComponent},

         {path: 'pricebook', component: PriceBookComponent, canActivate: [subscriptionGuard], data: {minPlan: 'Flow'}},
         {
            path: 'pricebook/items/category/:categoryId',
            canActivate: [subscriptionGuard],
            data: {minPlan: 'Flow'},
            loadComponent: () =>
               import('./admin/pricebook/price-book-item/price-book-item.component')
                  .then(m => m.PriceBookItemComponent)
         },
         {
            path: 'clients/create',
            component: CustomerComponent
         },
         {
            path: 'jobs',
            component: JobComponent
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
            path: 'invoices',
            component: InvoicesComponent
         },
         {
            path: 'estimates',
            component: EstimatesComponent
         },
         {
            path: 'help',
            component: HelpComponent
         },
         {
            path: 'dispatch',
            component: DispatchComponent
         },
         {
            path: 'connectedpayment',
            component: ConnectPaymentComponent
         },
         {
            path: 'billing-payments',
            component: BillingPaymentsComponent
         }
      ]
   },
   {
      path: 'onboarding',
      component: AdminLayoutComponent, 
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
      path: 'client-hub',
      loadChildren: () => import('./client-hub/client-hub.routes')
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
   },
   {
      path: 'estimate/view/:id',
      component: GeneralLayoutComponent,
      children: [
         {path: '', component: EstimateComponent},
      ]
   },
   {
      path: '**',
      component: NotFoundComponent
   }
];

