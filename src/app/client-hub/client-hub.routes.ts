import { Routes } from '@angular/router';
import { clientHubAuthGuard } from './guards/client-hub-auth.guard';
import { ClientHubLayoutComponent } from './layout/client-hub-layout.component';

export default [
  {
    path: 'auth/:token',
    loadComponent: () =>
      import('./pages/client-hub-auth/client-hub-auth.component').then((c) => c.ClientHubAuthComponent),
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./pages/client-hub-auth/client-hub-auth.component').then((c) => c.ClientHubAuthComponent),
  },
  {
    path: '',
    component: ClientHubLayoutComponent,
    canActivate: [clientHubAuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./pages/client-hub-overview/client-hub-overview.component').then(
            (c) => c.ClientHubOverviewComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/client-hub-profile/client-hub-profile.component').then(
            (c) => c.ClientHubProfileComponent,
          ),
      },
      {
        path: 'estimates',
        loadComponent: () =>
          import('./pages/client-hub-estimates/client-hub-estimates.component').then(
            (c) => c.ClientHubEstimatesComponent,
          ),
      },
      {
        path: 'estimates/:id',
        loadComponent: () =>
          import('./pages/client-hub-estimate-detail/client-hub-estimate-detail.component').then(
            (c) => c.ClientHubEstimateDetailComponent,
          ),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./pages/client-hub-invoices/client-hub-invoices.component').then(
            (c) => c.ClientHubInvoicesComponent,
          ),
      },
      {
        path: 'invoices/:id',
        loadComponent: () =>
          import('./pages/client-hub-invoice-detail/client-hub-invoice-detail.component').then(
            (c) => c.ClientHubInvoiceDetailComponent,
          ),
      },
      {
        path: 'request-work',
        loadComponent: () =>
          import('./pages/client-hub-request-work/client-hub-request-work.component').then(
            (c) => c.ClientHubRequestWorkComponent,
          ),
      },
    ],
  },
] as Routes;
