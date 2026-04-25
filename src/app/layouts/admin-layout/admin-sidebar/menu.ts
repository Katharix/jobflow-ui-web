import {MenuItem} from './menu.model';

export const MENU: MenuItem[] = [
   { label: 'Home', labelKey: 'nav.home', icon: 'house', link: '/admin' },
   {
      label: 'Company',
      labelKey: 'nav.company',
      icon: 'briefcase',
      subItems: [
         { label: 'Jobs', labelKey: 'nav.jobs', icon: '', link: '/admin/jobs' },
         { label: 'Invoicing', labelKey: 'nav.invoicing', icon: 'file-text', link: '/admin/invoices' },
         { label: 'Estimates', labelKey: 'nav.estimates', icon: 'file', link: '/admin/estimates' },
         { label: 'Tracking', labelKey: 'nav.tracking', icon: 'navigation', link: '/apps/email/inbox', minPlan: 'Max' },
         { label: 'Settings', labelKey: 'nav.settings', icon: 'settings', link: '/admin/settings/branding', minPlan: 'Flow' }
      ]
   },
   { label: 'Dispatch', labelKey: 'nav.dispatch', icon: 'circle-arrow-out-up-left', link: '/admin/dispatch', minPlan: 'Flow' },
   { label: 'Messaging', labelKey: 'nav.messaging', icon: 'messages-square', link: '/admin/messaging', minPlan: 'Flow' },
   { label: 'Clients', labelKey: 'nav.clients', icon: 'handshake', link: '/admin/clients/create' },
   { label: 'Employees', labelKey: 'nav.employees', icon: 'users-round', link: '/admin/employees', minPlan: 'Flow' },
   { label: 'Price Book', labelKey: 'nav.priceBook', icon: 'book-open-text', link: '/admin/pricebook', minPlan: 'Max' },
   { label: 'Billing & Payments', labelKey: 'nav.billingPayments', icon: 'banknote', link: '/admin/billing-payments' },
   { label: 'Reporting', labelKey: 'nav.reporting', icon: 'chart-no-axes-combined', link: '/admin/reporting', minPlan: 'Max' }
];
