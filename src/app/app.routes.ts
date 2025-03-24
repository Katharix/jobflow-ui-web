import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { HomeComponent } from './views/home/home.component';
import { authGuard } from './services/auth.guard';
import { DashboardComponent } from './views/admin-views/dashboard/dashboard.component';

export const routes: Routes = [
    {
        path: '',
        component: PublicLayoutComponent,
        children: [
             { path: '', component: HomeComponent },
        //   { path: 'admin', component: PricingComponent }
        ]
      },
      {
        path: 'admin',
        component: AdminLayoutComponent,
        canActivate: [authGuard],
        data: { roles: ['organizationAdmin', 'katharixAdmin'] },
        children: [
             { path: '', component: DashboardComponent },
        //   { path: 'users', component: AdminUsersComponent }
        ]
      },
      { 
        path: 'auth', 
        loadChildren: () => import('./views/admin-views/auth/auth.routes')
      },
];
