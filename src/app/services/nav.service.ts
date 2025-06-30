// nav.service.ts
import { Injectable } from '@angular/core';
import { NavItem } from '../models/nav-item';


@Injectable({ providedIn: 'root' })
export class NavService {
  private navConfig: { [key: string]: NavItem[] } = {
    '/admin': [

    ],
    '/admin/company': [
      { label: 'Invoicing', icon: '', route: '/admin/settings/branding' },
      { label: 'Estimates', icon: '', route: '/general/edit-profile' },
      { label: 'Team Management', icon: '', route: '/general/edit-profile' }
    ],
    '/admin/settings/branding': [
      { label: 'Branding', icon: '', route: '/admin/settings/branding' },
      { label: 'Edit Profile', icon: '', route: '/general/edit-profile' }
    ],
    '/admin/messaging': [
      { label: 'Employees', icon: '', route: '/admin/settings/branding' },
      { label: 'Clients', icon: '', route: '/general/edit-profile' }
    ],
        '/admin/employees': [
      { label: 'Employees', icon: '', route: '/admin/employees' },
      { label: 'Scheduling', icon: '', route: '/admin/employees/scheduling-employees' },
      { label: 'Roles', icon: '', route: '/general/edit-profile' }
    ]
  };

  getNavItems(path: string): NavItem[] {
    const matchingKey = Object.keys(this.navConfig)
      .filter(key => path.startsWith(key))
      .sort((a, b) => b.length - a.length)[0]; // longest match

    return matchingKey ? this.navConfig[matchingKey] : [];
  }

}
