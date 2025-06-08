// nav.service.ts
import { Injectable } from '@angular/core';
import { NavItem } from '../models/nav-item';


@Injectable({ providedIn: 'root' })
export class NavService {
  private navConfig: { [key: string]: NavItem[] } = {
    '/admin': [
      { label: 'Inbox', icon: 'feather icon-mail', route: '/admin/messages' },
      { label: 'Notifications', icon: 'feather icon-bell', route: '/admin/notifications' }
    ],
    '/admin/settings/branding': [
      { label: 'Branding', icon: 'feather icon-user', route: '/admin/settings/branding' },
      { label: 'Edit Profile', icon: 'feather icon-edit', route: '/general/edit-profile' }
    ]
  };

getNavItems(path: string): NavItem[] {
  const matchingKey = Object.keys(this.navConfig)
    .filter(key => path.startsWith(key))
    .sort((a, b) => b.length - a.length)[0]; // longest match

  return matchingKey ? this.navConfig[matchingKey] : [];
}

}
