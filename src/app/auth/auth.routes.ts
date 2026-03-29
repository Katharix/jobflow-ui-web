import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '../layouts/auth-layout/auth-layout.component';
import { AuthRedirectGuard } from '../core/guards/auth-redirect.guard';

export default [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./login/login.component').then((c) => c.LoginComponent),
         canActivate: [AuthRedirectGuard]
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./register/register.component').then((c) => c.RegisterComponent),
        canActivate: [AuthRedirectGuard]
      },
    ],
  },
] as Routes;
