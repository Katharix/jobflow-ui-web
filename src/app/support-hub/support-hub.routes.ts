import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { SupportHubLayoutComponent } from './layout/support-hub-layout.component';
import { SupportHubDashboardComponent } from './views/dashboard/support-hub-dashboard.component';
import { SupportHubTicketsComponent } from './views/tickets/support-hub-tickets.component';
import { SupportHubSessionsComponent } from './views/sessions/support-hub-sessions.component';
import { SupportHubOrganizationsComponent } from './views/organizations/support-hub-organizations.component';
import { SupportHubPeopleComponent } from './views/people/support-hub-people.component';
import { SupportHubSettingsComponent } from './views/settings/support-hub-settings.component';

export const SUPPORT_HUB_ROUTES: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/support-hub-auth.routes').then((m) => m.SUPPORT_HUB_AUTH_ROUTES),
  },
  {
    path: '',
    component: SupportHubLayoutComponent,
    canActivate: [authGuard],
    data: { roles: ['KatharixAdmin', 'KatharixEmployee'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SupportHubDashboardComponent },
      { path: 'tickets', component: SupportHubTicketsComponent },
      { path: 'sessions', component: SupportHubSessionsComponent },
      { path: 'organizations', component: SupportHubOrganizationsComponent },
      { path: 'people', component: SupportHubPeopleComponent },
      { path: 'settings', component: SupportHubSettingsComponent },
    ],
  },
];
