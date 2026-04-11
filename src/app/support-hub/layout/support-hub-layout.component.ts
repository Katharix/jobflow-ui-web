import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';

interface SupportHubNavItem {
  label: string;
  route: string;
  icon: string;
}

interface NavGroup {
  heading: string;
  items: SupportHubNavItem[];
}

@Component({
  selector: 'app-support-hub-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './support-hub-layout.component.html',
  styleUrl: './support-hub-layout.component.scss',
})
export class SupportHubLayoutComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);

  readonly navGroups: NavGroup[] = [
    {
      heading: 'Operations',
      items: [
        { label: 'Dashboard', route: '/support-hub/dashboard', icon: 'ti ti-layout-dashboard' },
        { label: 'Tickets', route: '/support-hub/tickets', icon: 'ti ti-ticket' },
        { label: 'Sessions', route: '/support-hub/sessions', icon: 'ti ti-headset' },
      ]
    },
    {
      heading: 'Accounts',
      items: [
        { label: 'Organizations', route: '/support-hub/organizations', icon: 'ti ti-building-community' },
        { label: 'Billing', route: '/support-hub/billing', icon: 'ti ti-credit-card' },
      ]
    },
    {
      heading: 'Platform',
      items: [
        { label: 'Help Content', route: '/support-hub/content', icon: 'ti ti-book' },
        { label: 'People', route: '/support-hub/people', icon: 'ti ti-users-group' },
        { label: 'Audit Logs', route: '/support-hub/audit-logs', icon: 'ti ti-file-text' },
        { label: 'Settings', route: '/support-hub/settings', icon: 'ti ti-settings' },
      ]
    }
  ];

  userDisplayName = '';
  userInitials = 'KH';
  userEmail = '';
  year = new Date().getFullYear();
  sidebarCollapsed = false;
  tokenCopiedMessage = '';

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user) {
      this.userEmail = user.email ?? '';
      this.userDisplayName = user.displayName ?? this.userEmail.split('@')[0] ?? 'Staff';
      this.userInitials = this.getInitials(this.userDisplayName);
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  async copyToken(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      this.tokenCopiedMessage = 'No user signed in.';
      this.clearToast();
      return;
    }
    const token = await user.getIdToken(true);
    await navigator.clipboard.writeText(token);
    this.tokenCopiedMessage = 'Token copied to clipboard';
    this.clearToast();
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    await this.router.navigate(['/support-hub/auth/login']);
  }

  private clearToast(): void {
    setTimeout(() => { this.tokenCopiedMessage = ''; }, 3000);
  }

  private getInitials(name: string): string {
    return name
      .split(/[\s.@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0].toUpperCase())
      .join('');
  }
}
