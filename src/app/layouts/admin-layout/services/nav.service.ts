// nav.service.ts
import {Injectable} from '@angular/core';
import {NavItem} from '../../../models/nav-item';


@Injectable({providedIn: 'root'})
export class NavService {
   private readonly billingNavItems: NavItem[] = [
      {label: 'Billing & Payments', icon: '', route: '/admin/billing-payments'},
      {label: 'Connected Accounts', icon: '', route: '/admin/connectedpayment', allowDeepMatch: true}
   ];

   private navConfig: Record<string, NavItem[]> = {
      '/admin': [],
      '/admin/estimates': [
         {label: 'Estimates', icon: '', route: '/admin/estimates', allowDeepMatch: true},
      ],
        '/admin/invoices': [
         {label: 'Invoices', icon: '', route: '/admin/invoices', allowDeepMatch: true},
      ],
        '/admin/clients': [
         {label: 'Clients', icon: '', route: '/admin/clients', allowDeepMatch: true},
      ],
      '/admin/settings/branding': [
         {label: 'Branding', icon: '', route: '/admin/settings/branding'},
         {label: 'Workflow', icon: '', route: '/admin/settings/workflow'},
         {label: 'Edit Profile', icon: '', route: '/general/edit-profile'}
      ],
      '/admin/settings/workflow': [
         {label: 'Branding', icon: '', route: '/admin/settings/branding'},
         {label: 'Workflow', icon: '', route: '/admin/settings/workflow'},
         {label: 'Edit Profile', icon: '', route: '/general/edit-profile'}
      ],
      '/admin/jobs': [
         {label: 'Jobs', icon: '', route: '/admin/jobs', allowDeepMatch: true}
      ],
      '/admin/messaging': [
         {label: 'Employees', icon: '', route: '/admin/settings/branding'},
         {label: 'Clients', icon: '', route: '/general/edit-profile'}
      ],
      '/admin/company': [
         {label: 'Invoicing', icon: '', route: '/admin/invoices', allowDeepMatch: true}
      ],
      '/admin/dispatch': [
         {label: 'Dispatch', icon: '', route: '/admin/dispatch'},
         {label: 'Schedule', icon: '', route: '/admin/scheduling-jobs', allowDeepMatch: true},
         {label: 'Jobs', icon: '', route: '/admin/jobs', allowDeepMatch: true}
      ],
      '/admin/employees': [
         {label: 'Employees', icon: '', route: '/admin/employees'},
         {label: 'Roles', icon: '', route: '/admin/employees/roles', allowDeepMatch: true}
      ],
      '/admin/pricebook': [
         {label: 'Materials', icon: '', route: '/admin/pricebook', allowDeepMatch: true},
         {label: 'Services', icon: '', route: '/general/edit-profile'}
      ],
      '/admin/billing-payments': this.billingNavItems,
      '/admin/connectedpayment': this.billingNavItems
   };

   getNavItems(path: string): NavItem[] {
      const normalizedPath = path.split('?')[0].split('#')[0];

      const matchingKey = Object.keys(this.navConfig)
         .filter(key => normalizedPath.startsWith(key))
         .sort((a, b) => b.length - a.length)[0];

      const items = matchingKey ? this.navConfig[matchingKey] : [];

      return items.map(item => {
         if (!item.route) return {...item, active: false};

         if (item.route === '/admin/billing-payments') {
            return {
               ...item,
               active: normalizedPath.startsWith('/admin/billing-payments')
            };
         }

         if (item.route === '/admin/connectedpayment') {
            return {
               ...item,
               active: normalizedPath.startsWith('/admin/connectedpayment')
            };
         }

         const isExact = normalizedPath === item.route;
         const isDeep = item.allowDeepMatch && normalizedPath.startsWith(item.route);

         return {
            ...item,
            active: isExact || isDeep
         };
      });
   }

}
