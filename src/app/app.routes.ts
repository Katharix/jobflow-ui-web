import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { HomeComponent } from './views/home/home.component';
import { authGuard } from './services/auth.guard';
import { DashboardComponent } from './views/admin-views/dashboard/dashboard.component';
import { SubscribeComponent } from './views/subscription-views/subscribe/subscribe.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { InvoiceComponent } from './views/general/invoice/invoice.component';
import { GeneralLayoutComponent } from './layouts/general-layout/general-layout.component';
import { OnboardingChecklistComponent } from './views/general/onboarding-checklist/onboarding-checklist.component';
import { onboardingGuard } from './services/onboarding.guard';
import { redirectIfOnboardedGuard } from './services/redirect-if-onboarded.guard';
import { BrandingComponent } from './views/general/onboarding-checklist/onboarding-steps/branding/branding.component';
import { CompanyComponent } from './views/admin-views/general/company/company.component';
import { ChatComponent } from './views/admin-views/general/chat/chat.component';
import { EmployeesComponent } from './views/admin-views/general/employees/employees.component';
import { JobScheduleComponent } from './views/admin-views/general/scheduling/job-schedule/job-schedule.component';
import { EmployeeScheduleComponent } from './views/admin-views/general/scheduling/employee-schedule/employee-schedule.component';


export const routes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: HomeComponent }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard], // ✅ guard only post-onboarding routes
    children: [
      { path: '', component: DashboardComponent },
      { path: 'settings/branding', component:  BrandingComponent },
      { path: 'messaging', component: ChatComponent },
      { path: 'company', component: CompanyComponent },
      { path: 'employees', component: EmployeesComponent },
      { path: 'scheduling-jobs', component: JobScheduleComponent },
      { path: 'employees/scheduling-employees', component: EmployeeScheduleComponent }
    ]
  },
  {
    path: 'onboarding',
    component: AdminLayoutComponent, // ✅ still use admin layout
    children: [
      {
        path: '',
        component: OnboardingChecklistComponent,
        canActivate: [redirectIfOnboardedGuard] // ✅ skip if already onboarded
      }
    ]
  },
  {
    path: 'auth',
    loadChildren: () => import('./views/admin-views/auth/auth.routes')
  },
  {
    path: 'subscribe',
    component: AuthLayoutComponent,
    children: [
      { path: '', component: SubscribeComponent },
    ]
  },
  {
    path: 'invoice/view/:id',
    component: GeneralLayoutComponent,
    children: [
      { path: '', component: InvoiceComponent },
    ]
  }
];

