
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ClientHubAuthService } from '../services/client-hub-auth.service';

interface ClientHubNavItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-client-hub-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './client-hub-layout.component.html',
  styleUrl: './client-hub-layout.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ClientHubLayoutComponent {
  private readonly authService = inject(ClientHubAuthService);
  private readonly router = inject(Router);

  isMenuOpen = false;
  readonly year = new Date().getFullYear();

  readonly navItems: ClientHubNavItem[] = [
    { label: 'Overview', route: '/client-hub/overview' },
    { label: 'Messages', route: '/client-hub/chat' },
    { label: 'My Info', route: '/client-hub/profile' },
    { label: 'Updates', route: '/client-hub/jobs' },
    { label: 'Estimates', route: '/client-hub/estimates' },
    { label: 'Invoices', route: '/client-hub/invoices' },
    { label: 'Request Work', route: '/client-hub/request-work' },
  ];

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authService.clearToken();
    this.router.navigate(['/client-hub/auth']);
  }
}
