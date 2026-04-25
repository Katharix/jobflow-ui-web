import { Injectable, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { HelpArticleCategory } from '../../models/help-content';

const ROUTE_CATEGORY_MAP: [string, HelpArticleCategory][] = [
  ['/invoices', 'Invoicing'],
  ['/estimates', 'Estimates'],
  ['/clients', 'Clients'],
  ['/employees', 'Employees'],
  ['/jobs', 'Jobs'],
  ['/scheduling', 'Dispatch'],
  ['/dispatch', 'Dispatch'],
  ['/messaging', 'Messaging'],
  ['/chat', 'Messaging'],
  ['/billing', 'Billing'],
  ['/subscription', 'Subscription'],
  ['/branding', 'Branding'],
  ['/settings', 'Settings'],
  ['/pricebook', 'GettingStarted'],
  ['/company', 'GettingStarted'],
];

@Injectable({ providedIn: 'root' })
export class HelpPanelService {
  private router = inject(Router);

  readonly isOpen = signal(false);

  private readonly routeUrl = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly contextCategory = computed<HelpArticleCategory>(() => {
    const url = this.routeUrl() ?? '';
    const match = ROUTE_CATEGORY_MAP.find(([segment]) => url.includes(segment));
    return match ? match[1] : 'GettingStarted';
  });

  open(): void { this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); }
  toggle(): void { this.isOpen.update(v => !v); }
}
