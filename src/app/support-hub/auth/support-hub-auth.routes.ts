import { Routes } from '@angular/router';
import { SupportHubAuthLayoutComponent } from './layout/support-hub-auth-layout.component';
import { SupportHubLoginComponent } from './login/support-hub-login.component';
import { SupportHubRegisterComponent } from './register/support-hub-register.component';

export const SUPPORT_HUB_AUTH_ROUTES: Routes = [
  {
    path: '',
    component: SupportHubAuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: SupportHubLoginComponent },
      { path: 'register', component: SupportHubRegisterComponent },
    ],
  },
];
