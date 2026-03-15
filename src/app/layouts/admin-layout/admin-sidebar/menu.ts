import {MenuItem} from './menu.model';

export const MENU: MenuItem[] = [
   { label: 'Home', icon: 'house', link: '/admin' },
   {
      label: 'Company',
      icon: 'briefcase',
      subItems: [
         { label: 'Jobs', icon: '', link: '/admin/jobs' },
         { label: 'Invoicing', icon: 'file-text', link: '/admin/invoices' },
         { label: 'Estimates', icon: 'file', link: '/admin/estimates' },
         { label: 'Tracking', icon: 'navigation', link: '/apps/email/inbox', minPlan: 'Max' },
         { label: 'Settings', icon: 'settings', link: '/admin/settings/branding', minPlan: 'Flow' }
      ]
   },
   { label: 'Dispatch', icon: 'circle-arrow-out-up-left', link: '/admin/messaging', minPlan: 'Flow' },
   { label: 'Messaging', icon: 'messages-square', link: '/admin/messaging', minPlan: 'Flow' },
   { label: 'Clients', icon: 'handshake', link: '/admin/clients/create' },
   { label: 'Employees', icon: 'users-round', link: '/admin/employees', minPlan: 'Flow' },
   { label: 'Price Book', icon: 'book-open-text', link: '/admin/pricebook', minPlan: 'Max' },
   { label: 'Billing & Payments', icon: 'banknote', link: '/apps/chat' },
   { label: 'Reporting', icon: 'chart-no-axes-combined', link: '/apps/chat', minPlan: 'Max' }
];
