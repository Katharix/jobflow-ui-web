import {Routes} from '@angular/router';
import {PublicLayoutComponent} from './layouts/public-layout/public-layout.component';
import {AdminLayoutComponent} from './layouts/admin-layout/admin-layout.component';
import {HomeComponent} from './views/home/home.component';
import {authGuard} from './core/guards/auth.guard';
import {subscriptionGuard} from './core/guards/subscription.guard';
import {subscriptionAccessGuard} from './core/guards/subscription-access.guard';
import {AuthLayoutComponent} from './layouts/auth-layout/auth-layout.component';
import {GeneralLayoutComponent} from './layouts/general-layout/general-layout.component';


export const routes: Routes = [
   {
      path: '',
      component: PublicLayoutComponent,
      children: [
         {path: '', component: HomeComponent},
         {path: 'terms', loadComponent: () => import('./views/general/terms/terms.component').then(m => m.TermsComponent)},
         {path: 'privacy', loadComponent: () => import('./views/general/privacy/privacy.component').then(m => m.PrivacyComponent)}
      ]
   },
   {path: 'i', loadChildren: () => import('./views/general/invite-accept/invite.routes').then(m => m.INVITE_ROUTES)},

   {
      path: 'admin',
      component: AdminLayoutComponent,
      canActivate: [authGuard],
      canActivateChild: [subscriptionAccessGuard],
      children: [
         {path: '', loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent)},
         {
            path: 'settings/branding',
            canActivate: [subscriptionGuard],
            data: {minPlan: 'Flow'},
            loadComponent: () => import('./admin/branding/branding.component').then(m => m.BrandingComponent)
         },
         {
            path: 'settings/workflow',
            canActivate: [subscriptionGuard],
            data: {minPlan: 'Flow'},
            loadComponent: () => import('./admin/settings/workflow-settings/workflow-settings.component').then(m => m.WorkflowSettingsComponent)
         },
         {path: 'messaging', loadComponent: () => import('./admin/chat/chat.component').then(m => m.ChatComponent)},
         {path: 'company', loadComponent: () => import('./admin/company/company.component').then(m => m.CompanyComponent), data: { allowExpiredAccess: true }},

         {
            path: 'employees',
            canActivate: [subscriptionGuard],
            data: {minPlan: 'Flow'},
            loadComponent: () => import('./admin/employees/employees.component').then(m => m.EmployeesComponent)
         },
         {
            path: 'employees/roles',
            canActivate: [subscriptionGuard],
            data: {minPlan: 'Flow'},
            loadComponent: () => import('./admin/employee-roles/employee-roles.component').then(m => m.EmployeeRolesComponent)
         },

         {path: 'scheduling-jobs', loadComponent: () => import('./admin/jobs/job-schedule/job-schedule.component').then(m => m.JobScheduleComponent)},

         {
            path: 'pricebook',
            canActivate: [subscriptionGuard],
            data: {minPlan: 'Flow'},
            loadComponent: () => import('./admin/pricebook/pricebook.component').then(m => m.PriceBookComponent)
         },
         {
            path: 'pricebook/services',
            canActivate: [subscriptionGuard],
            data: {minPlan: 'Flow'},
            loadComponent: () =>
               import('./admin/pricebook/pricebook-services/pricebook-services.component')
                  .then(m => m.PricebookServicesComponent)
         },
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
            loadComponent: () => import('./admin/customer/customer.component').then(m => m.CustomerComponent)
         },
         {
            path: 'jobs',
            loadComponent: () => import('./admin/jobs/job.component').then(m => m.JobComponent)
         },
         {
            path: 'jobs/:jobId/schedule',
            loadComponent: () => import('./admin/jobs/job-schedule/job-schedule.component').then(m => m.JobScheduleComponent)
         },
         {
            path: 'jobs/:jobId/invoice',
            loadComponent: () => import('./admin/jobs/job-invoice/job-invoice.component').then(m => m.JobInvoiceComponent)
         },
         {
            path: 'jobs/templates',
            canActivate: [subscriptionGuard],
            data: {minPlan: 'Go'},
            loadComponent: () =>
               import('./admin/jobs/job-templates/job-templates.component')
                  .then(m => m.JobTemplatesComponent)
         },
         {
            path: 'invoices',
            loadComponent: () => import('./admin/invoices/invoices.component').then(m => m.InvoicesComponent)
         },
         {
            path: 'estimates',
            loadComponent: () => import('./admin/estimates/estimates.component').then(m => m.EstimatesComponent)
         },
         {
            path: 'help',
            loadComponent: () => import('./admin/help/help.component').then(m => m.HelpComponent)
         },
         {
            path: 'dispatch',
            loadComponent: () => import('./admin/dispatch/dispatch.component').then(m => m.DispatchComponent)
         },
         {
            path: 'connectedpayment',
            loadComponent: () => import('./views/general/onboarding-checklist/onboarding-steps/connect-payment/connect-payment.component').then(m => m.ConnectPaymentComponent)
         },
         {
            path: 'onboarding/quick-start',
            canActivate: [subscriptionGuard],
            data: { minPlan: 'Go' },
            loadComponent: () => import('./views/general/onboarding-checklist/onboarding-steps/quick-start/quick-start.component').then(m => m.OnboardingQuickStartComponent)
         },
         {
            path: 'billing-payments',
            loadComponent: () => import('./admin/billing-payments/billing-payments.component').then(m => m.BillingPaymentsComponent)
         },
         {
            path: 'subscription-management',
            loadComponent: () => import('./admin/subscription-management/subscription-management.component').then(m => m.SubscriptionManagementComponent)
         },
         {
            path: 'reporting',
            canActivate: [subscriptionGuard],
            data: { minPlan: 'Max' },
            loadComponent: () => import('./admin/reporting/reporting.component').then(m => m.ReportingComponent)
         },
         {
            path: 'support-chat',
            loadComponent: () => import('./admin/support-chat/org-support-chat.component').then(m => m.OrgSupportChatComponent)
         }
      ]
   },
   {
      path: 'user-profile',
      component: AdminLayoutComponent,
      canActivate: [authGuard],
      canActivateChild: [subscriptionAccessGuard],
      children: [
         {
            path: '',
            data: { minPlan: 'Go' },
            loadComponent: () => import('./views/general/user-profile/user-profile.component').then(m => m.UserProfileComponent)
         }
      ]
   },
   {
      path: 'onboarding',
      component: AdminLayoutComponent, 
      canActivate: [authGuard],
      canActivateChild: [subscriptionAccessGuard],
      children: [
         {
            path: '',
            loadComponent: () => import('./views/general/onboarding-checklist/onboarding-checklist.component').then(m => m.OnboardingChecklistComponent)
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
      path: 'support-hub',
      loadChildren: () => import('./support-hub/support-hub.routes').then(m => m.SUPPORT_HUB_ROUTES)
   },
   {
      path: 'subscribe',
      component: AuthLayoutComponent,
      children: [
         {path: '', loadComponent: () => import('./views/subscription-views/subscribe/subscribe.component').then(m => m.SubscribeComponent)},
      ]
   },
   {
      path: 'subscription-required',
      component: GeneralLayoutComponent,
      children: [
         {path: '', loadComponent: () => import('./views/subscription-views/subscription-required/subscription-required.component').then(m => m.SubscriptionRequiredComponent)}
      ]
   },
   {
      path: 'invoice/view/:id',
      component: GeneralLayoutComponent,
      children: [
         {path: '', loadComponent: () => import('./views/general/invoice/invoice.component').then(m => m.InvoiceComponent)},
      ]
   },
   {
      path: 'estimate/view/:id',
      component: GeneralLayoutComponent,
      children: [
         {path: '', loadComponent: () => import('./views/general/estimate/estimate.component').then(m => m.EstimateComponent)},
      ]
   },
   {
      path: '**',
      loadComponent: () => import('./views/general/not-found/not-found.component').then(m => m.NotFoundComponent)
   }
];

