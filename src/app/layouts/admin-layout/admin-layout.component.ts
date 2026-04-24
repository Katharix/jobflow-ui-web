import {Component, DOCUMENT, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {Location} from '@angular/common';
import {NavigationEnd, Router, RouterModule, RouterOutlet} from '@angular/router';
import {AdminSidebarComponent} from "./admin-sidebar/admin-sidebar.component";
import {AdminNavbarComponent} from './admin-navbar/admin-navbar.component';
import {AdminFooterComponent} from './admin-footer/admin-footer.component';
import {filter} from 'rxjs';
import { ChatWidgetComponent } from '../../common/chat-widget/chat-widget.component';


@Component({
   selector: 'app-admin-layout',
   standalone: true,
   imports: [RouterOutlet, AdminNavbarComponent, AdminFooterComponent, AdminSidebarComponent, RouterModule, ChatWidgetComponent],
   templateUrl: './admin-layout.component.html',
   styleUrl: './admin-layout.component.scss',
   encapsulation: ViewEncapsulation.None
})
export class AdminLayoutComponent implements OnInit {
   private router = inject(Router);
   private location = inject(Location);
   private document = inject(DOCUMENT);
   showBackButton = false;

   ngOnInit(): void {
      this.resetSidebarClasses();
      this.updateBackButton(this.router.url);

      this.router.events
         .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
         .subscribe(event => this.updateBackButton(event.urlAfterRedirects));


   }

   goBack(): void {
      this.location.back();
   }

   private resetSidebarClasses(): void {
      this.document.body.classList.remove('sidebar-open', 'sidebar-folded', 'open-sidebar-folded', 'settings-open');
   }

   private updateBackButton(url: string): void {
      const cleanUrl = url.split('?')[0];
      this.showBackButton = !(cleanUrl === '/admin' || cleanUrl === '/admin/');
   }
}
