import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Home',
    icon: 'house',
    link: '/admin'
  },
  {
    label: 'Company',
    icon: 'briefcase',
    subItems: [
      {
        label: 'Jobs',
        icon: '',
        link: '/apps/email/inbox',
      },
      {
        label: 'Scheduling',
        icon: 'calendar',
        link: '/admin/scheduling-jobs',
      },
      {
        label: 'Invoicing',
        icon: 'file-text',
        link: '/apps/email/inbox',
      },
      {
        label: 'Estimates',
        icon: 'file',
        link: '/apps/email/inbox',
      },
      {
        label: 'Tracking',
        icon: 'navigation',
        link: '/apps/email/inbox',
      },
      {
        label: 'Settings',
        icon: 'settings',
        link: '/admin/settings/branding',
      }
    ]
  },
  {
    label: 'Messaging',
    icon: 'messages-square',
    link: '/admin/messaging',
  },
   {
      label: 'Clients',
      icon: 'users',
      link: '/admin/clients/create',
   },
  {
    label: 'Employees',
    icon: 'users-round',
    link: '/admin/employees',
  },
  {
    label: 'Price Book',
    icon: 'book-open-text',
    link: '/admin/pricebook',
  },
  {
    label: 'Billing & Payments',
    icon: 'banknote',
    link: '/apps/chat',
  },
  {
    label: 'Reporting',
    icon: 'chart-no-axes-combined',
    link: '/apps/chat',
  }
  // {
  //   label: 'Calendar',
  //   icon: 'calendar',
  //   link: '/apps/calendar',
  //   badge: {
  //     variant: 'primary',
  //     text: 'Event',
  //   }
  // }
];
