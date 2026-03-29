import {ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation} from '@angular/core';
import {DOCUMENT, Location} from '@angular/common';
import {NavigationEnd, Router, RouterModule, RouterOutlet} from '@angular/router';
import {AdminSidebarComponent} from "./admin-sidebar/admin-sidebar.component";
import {AdminNavbarComponent} from './admin-navbar/admin-navbar.component';
import {AdminFooterComponent} from './admin-footer/admin-footer.component';
import {PreloaderComponent} from "../../landing/preloader.component";
import {LoadingService} from '../../services/shared/loading-service.service';
import {filter} from 'rxjs';


@Component({
   selector: 'app-admin-layout',
   standalone: true,
   imports: [RouterOutlet, AdminNavbarComponent, AdminFooterComponent, AdminSidebarComponent, PreloaderComponent, RouterModule],
   templateUrl: './admin-layout.component.html',
   styleUrl: './admin-layout.component.scss',
   encapsulation: ViewEncapsulation.None
})
export class AdminLayoutComponent implements OnInit {
   isLoading = false;
   private router = inject(Router);
   private location = inject(Location);
   private loadingService = inject(LoadingService);
   private cdr = inject(ChangeDetectorRef);
   private document = inject(DOCUMENT);
   showBackButton = false;

   ngOnInit(): void {
      this.resetSidebarClasses();
      this.updateBackButton(this.router.url);

      this.router.events
         .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
         .subscribe(event => this.updateBackButton(event.urlAfterRedirects));

      this.loadingService.isLoading$.subscribe(value => {
         // Use setTimeout to push change detection to the next cycle
         setTimeout(() => {
            this.isLoading = value;
            this.cdr.detectChanges(); // <-- Safely tell Angular to recheck
         });
      });
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
