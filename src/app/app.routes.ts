import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { HomeComponent } from './views/home/home.component';
import { authGuard } from './services/auth.guard';
import { DashboardComponent } from './views/admin-views/dashboard/dashboard.component';
import { SubscribeComponent } from './views/subscription-views/subscribe/subscribe.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

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
    canActivate: [authGuard],
    data: { roles: ['OrganizationAdmin', 'KatharixAdmin', 'SuperAdmin'] },
    children: [
      { path: '', component: DashboardComponent },
    ]
  },
  { 
    path: 'auth', 
    loadChildren: () => import('./views/admin-views/auth/auth.routes')
  },
  {
    path: 'subscribe',
    component: AuthLayoutComponent,
    children:[
      { path: '', component: SubscribeComponent },
    ]
  }
];

