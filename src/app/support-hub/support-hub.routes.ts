import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { SupportHubLayoutComponent } from './layout/support-hub-layout.component';
import { SupportHubDashboardComponent } from './views/dashboard/support-hub-dashboard.component';
import { SupportHubTicketsComponent } from './views/tickets/support-hub-tickets.component';
import { SupportHubSessionsComponent } from './views/sessions/support-hub-sessions.component';
import { SupportHubOrganizationsComponent } from './views/organizations/support-hub-organizations.component';
import { SupportHubPeopleComponent } from './views/people/support-hub-people.component';
import { SupportHubSettingsComponent } from './views/settings/support-hub-settings.component';
import { SupportHubBillingComponent } from './views/billing/support-hub-billing.component';
import { SupportHubContentComponent } from './views/content/support-hub-content.component';
import { SupportHubAuditLogsComponent } from './views/audit-logs/support-hub-audit-logs.component';
import { SupportHubQueueComponent } from './views/queue/support-hub-queue.component';
import { SupportHubLiveChatComponent } from './views/live-chat/support-hub-live-chat.component';

export const SUPPORT_HUB_ROUTES: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./auth/support-hub-auth.routes').then((m) => m.SUPPORT_HUB_AUTH_ROUTES),
  },
  {
    path: 'customer-login',
    loadComponent: () =>
      import('./auth/customer-login/support-hub-customer-login.component').then(m => m.SupportHubCustomerLoginComponent),
  },
  {
    path: 'queue-status/:sessionId',
    loadComponent: () =>
      import('./views/queue-status/support-hub-queue-status.component').then(m => m.SupportHubQueueStatusComponent),
  },
  {
    path: 'chat/:sessionId',
    loadComponent: () =>
      import('./views/chat/support-hub-chat.component').then(m => m.SupportHubChatComponent),
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
      { path: 'billing', component: SupportHubBillingComponent },
      { path: 'content', component: SupportHubContentComponent },
      { path: 'people', component: SupportHubPeopleComponent },
      { path: 'settings', component: SupportHubSettingsComponent },
      { path: 'audit-logs', component: SupportHubAuditLogsComponent },
      { path: 'queue', component: SupportHubQueueComponent },
      { path: 'live-chat/:sessionId', component: SupportHubLiveChatComponent },
    ],
  },
];
