// nav.service.ts
import {Injectable} from '@angular/core';
import {NavItem} from '../../../models/nav-item';


@Injectable({providedIn: 'root'})
export class NavService {
   private navConfig: { [key: string]: NavItem[] } = {
      '/admin': [],
      '/admin/company': [
         {label: 'Invoicing', icon: '', route: '/admin/settings/branding'},
         {label: 'Estimates', icon: '', route: '/general/edit-profile'},
         {label: 'Team Management', icon: '', route: '/general/edit-profile'}
      ],
      '/admin/settings/branding': [
         {label: 'Branding', icon: '', route: '/admin/settings/branding'},
         {label: 'Edit Profile', icon: '', route: '/general/edit-profile'}
      ],
      '/admin/jobs': [
         {label: 'Jobs', icon: '', route: '/admin/jobs', allowDeepMatch: true}
      ],
      '/admin/messaging': [
         {label: 'Employees', icon: '', route: '/admin/settings/branding'},
         {label: 'Clients', icon: '', route: '/general/edit-profile'}
      ],
      '/admin/employees': [
         {label: 'Employees', icon: '', route: '/admin/employees'},
         {label: 'Scheduling', icon: '', route: '/admin/employees/scheduling-employees', allowDeepMatch: true},
         {label: 'Roles', icon: '', route: '/admin/employees/roles', allowDeepMatch: true}
      ],
      '/admin/pricebook': [
         {label: 'Materials', icon: '', route: '/admin/pricebook', allowDeepMatch: true},
         {label: 'Services', icon: '', route: '/general/edit-profile'}
      ],
   };

   getNavItems(path: string): NavItem[] {
      const matchingKey = Object.keys(this.navConfig)
         .filter(key => path.startsWith(key))
         .sort((a, b) => b.length - a.length)[0];

      const items = matchingKey ? this.navConfig[matchingKey] : [];

      return items.map(item => {
         if (!item.route) return {...item, active: false};

         const isExact = path === item.route;
         const isDeep = item.allowDeepMatch && path.startsWith(item.route);

         return {
            ...item,
            active: isExact || isDeep
         };
      });
   }

}
