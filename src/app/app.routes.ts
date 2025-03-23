import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { HomeComponent } from './views/home/home.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';

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
        children: [
        //   { path: '', component: AdminDashboardComponent },
        //   { path: 'users', component: AdminUsersComponent }
        ]
      },
      { 
        path: 'auth', 
        loadChildren: () => import('./views/admin-views/auth/auth.routes')
      },
];
