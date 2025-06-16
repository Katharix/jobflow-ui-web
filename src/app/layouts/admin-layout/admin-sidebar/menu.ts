import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Home',
    icon: 'home',
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
        link: '/apps/email/inbox',
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
    icon: 'message-square',
    link: '/admin//messaging',
  },
  {
    label: 'Employees',
    icon: 'users',
    link: '/apps/chat',
  },
  {
    label: 'Billing & Payments',
    icon: 'credit-card',
    link: '/apps/chat',
  },
  {
    label: 'Reporting',
    icon: 'bar-chart-2',
    link: '/apps/chat',
  },
  {
    label: 'Help',
    icon: 'help-circle',
    link: '/apps/chat',
  },
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
