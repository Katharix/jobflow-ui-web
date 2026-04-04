import { NgClass } from '@angular/common';
import { AfterViewInit, Component, DOCUMENT, ElementRef, OnInit, Renderer2, ViewChild, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule } from '@ngx-translate/core';

import { NgScrollbar } from 'ngx-scrollbar';
import MetisMenu from 'metismenujs';

import { MENU } from './menu';
import { MenuItem, SubscriptionPlan } from './menu.model';
import { LogoutService } from '../services/logout.service';
import { OrganizationContextService } from '../../../services/shared/organization-context.service';
import { OrganizationDto } from '../../../models/organization';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NgScrollbar,
    NgClass,
    LucideAngularModule,
    TranslateModule
],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent implements OnInit, AfterViewInit {
  private document = inject<Document>(DOCUMENT);
  private renderer = inject(Renderer2);
  private router = inject(Router);
  private logoutService = inject(LogoutService);
  private orgContext = inject(OrganizationContextService);

  @ViewChild('sidebarMenu') sidebarMenu: ElementRef;

  menuItems: MenuItem[] = [];
  org: OrganizationDto | null = null;
  onboardingComplete = false;
  showLogoutModal = false;
  private menuInstance: MetisMenu | null = null;

  ngOnInit(): void {
    this.orgContext.org$.subscribe(org => {
      if (!org) {
        this.menuItems = [];
        return;
      }

      this.org = org;

      // normalize and default
      const plan = (org.subscriptionPlanName ?? 'Go') as SubscriptionPlan;

      // apply plan-based filtering
      this.menuItems = this.filterMenuByPlan(MENU, plan);
      this.scheduleMenuInit();
    });

    // Sidebar-folded on desktop (992px–1199px)
    const desktopMedium = window.matchMedia('(min-width:992px) and (max-width: 1199px)');
    desktopMedium.addEventListener('change', () => this.iconSidebar(desktopMedium));
    this.iconSidebar(desktopMedium);
  }

  ngAfterViewInit() {
    this.scheduleMenuInit();
  }

  private scheduleMenuInit(): void {
    if (!this.sidebarMenu?.nativeElement) {
      return;
    }

    setTimeout(() => {
      if (this.menuInstance && typeof this.menuInstance.dispose === 'function') {
        this.menuInstance.dispose();
      }

      this.menuInstance = new MetisMenu(this.sidebarMenu.nativeElement);
    }, 0);
  }

  get isSidebarOpen(): boolean {
    const body = this.document.body.classList;
    return !body.contains('sidebar-folded') || body.contains('open-sidebar-folded');
  }

  operSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')) {
      this.document.body.classList.add('open-sidebar-folded');
    }
  }

  closeSidebarFolded() {
    if (this.document.body.classList.contains('sidebar-folded')) {
      this.document.body.classList.remove('open-sidebar-folded');
    }
  }

  iconSidebar(mq: MediaQueryList) {
    if (mq.matches) {
      this.document.body.classList.add('sidebar-folded');
    } else {
      this.document.body.classList.remove('sidebar-folded');
    }
  }

  hasItems(item: MenuItem) {
    return item.subItems !== undefined && item.subItems.length > 0;
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  logout(): void {
    this.showLogoutModal = false;
    this.logoutService.logout();
  }

  private filterMenuByPlan(items: MenuItem[], currentPlan: SubscriptionPlan): MenuItem[] {
    return items
      .map((item) => {
        const subItems = item.subItems
          ? this.filterMenuByPlan(item.subItems, currentPlan)
          : undefined;

        return { ...item, subItems };
      })
      .filter((item) => {
        const allowed = !item.minPlan || this.rank(currentPlan) >= this.rank(item.minPlan);
        const hasVisibleChildren = !!item.subItems?.length;
        return allowed && (item.isTitle || !!item.link || hasVisibleChildren);
      });
  }

  private rank(plan: SubscriptionPlan): number {
    if (plan === 'Go') return 0;
    if (plan === 'Flow') return 1;
    return 2; // Max
  }
}
