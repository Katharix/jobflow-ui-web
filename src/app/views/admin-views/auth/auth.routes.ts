// src/app/views/admin-views/auth/auth.routes.ts
import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '../../../layouts/auth-layout/auth-layout.component';
import { firebaseProviders } from '../../../firebase.providers';

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
        providers: [...firebaseProviders]
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./register/register.component').then((c) => c.RegisterComponent),
        providers: [...firebaseProviders]
      },
    ],
  },
] as Routes;
