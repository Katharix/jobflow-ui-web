import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface SupportHubNavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-support-hub-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './support-hub-layout.component.html',
  styleUrl: './support-hub-layout.component.scss',
})
export class SupportHubLayoutComponent {
  readonly navItems: SupportHubNavItem[] = [
    { label: 'Dashboard', route: '/support-hub/dashboard', icon: 'ti ti-layout-dashboard' },
    { label: 'Tickets', route: '/support-hub/tickets', icon: 'ti ti-lifebuoy' },
    { label: 'Sessions', route: '/support-hub/sessions', icon: 'ti ti-screen-share' },
    { label: 'Organizations', route: '/support-hub/organizations', icon: 'ti ti-building-community' },
    { label: 'People', route: '/support-hub/people', icon: 'ti ti-users' },
    { label: 'Settings', route: '/support-hub/settings', icon: 'ti ti-settings' },
  ];

  year = new Date().getFullYear();
}
