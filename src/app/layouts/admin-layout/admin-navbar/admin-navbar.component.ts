import { Component, OnInit, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {NavigationEnd, Router, RouterLink, RouterModule} from '@angular/router';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {OrganizationContextService} from '../../../services/shared/organization-context.service';
import {OrganizationDto} from '../../../models/organization';

import {NavItem} from '../../../models/nav-item';
import {filter} from 'rxjs/operators';
import {NavService} from "../services/nav.service";
import {LucideAngularModule} from 'lucide-angular';


@Component({
   selector: 'app-admin-navbar',
   standalone: true,
   imports: [
    NgbDropdownModule,
    RouterLink,
    RouterModule,
    LucideAngularModule
],
   templateUrl: './admin-navbar.component.html',
   styleUrl: './admin-navbar.component.scss',
})
export class AdminNavbarComponent implements OnInit {
   private router = inject(Router);
   private orgContext = inject(OrganizationContextService);
   private navService = inject(NavService);
   private document = inject(DOCUMENT);

   // currentTheme: string;
   navItems: NavItem[] = [];
   showNavbar = true;

   private hideNavbarRoutes: string[] = [
      
   ];


   org: OrganizationDto

   ngOnInit(): void {
      const initialUrl = this.router.url;
      this.showNavbar = !this.hideNavbarRoutes.some(route =>
         initialUrl.startsWith(route)
      );
      this.navItems = this.navService.getNavItems(initialUrl);

      this.router.events
         .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
         .subscribe(event => {
            const url = event.urlAfterRedirects;

            // Check if the route is in the hidden list
            this.showNavbar = !this.hideNavbarRoutes.some(route =>
               url.startsWith(route)
            );

            this.navItems = this.navService.getNavItems(url);
            this.document.body.classList.remove('sidebar-open');
         });

      this.orgContext.org$.subscribe(org => {
         if (org) {
            this.org = org;
         }
      });
   }

   toggleSidebar(): void {
      this.document.body.classList.toggle('sidebar-open');
   }

   showActiveTheme(theme: string) {
      const themeSwitcher = document.querySelector('#theme-switcher') as HTMLInputElement;
      const box = document.querySelector('.box') as HTMLElement;

      if (!themeSwitcher) {
         return;
      }

      // Toggle the custom checkbox based on the theme
      if (theme === 'dark') {
         themeSwitcher.checked = true;
         box.classList.remove('light');
         box.classList.add('dark');
      } else if (theme === 'light') {
         themeSwitcher.checked = false;
         box.classList.remove('dark');
         box.classList.add('light');
      }
   }

   /**
    * Change the theme on #theme-switcher checkbox changes
    */
   onThemeCheckboxChange(e: Event) {
      const checkbox = e.target as HTMLInputElement;
      const newTheme: string = checkbox.checked ? 'dark' : 'light';
      //this.themeModeService.toggleTheme(newTheme);
      this.showActiveTheme(newTheme);
   }

   /**
    * Logout
    */
   onLogout(e: Event) {
      e.preventDefault();

      localStorage.setItem('isLoggedin', 'false');
      if (localStorage.getItem('isLoggedin') === 'false') {
         this.router.navigate(['/auth/login']);
      }
   }

}
