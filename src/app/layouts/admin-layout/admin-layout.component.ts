import {ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation, DOCUMENT} from '@angular/core';

import { Router, RouterModule, RouterOutlet } from '@angular/router';
import {AdminSidebarComponent} from "./admin-sidebar/admin-sidebar.component";
import {AdminNavbarComponent} from './admin-navbar/admin-navbar.component';
import {AdminFooterComponent} from './admin-footer/admin-footer.component';
import {PreloaderComponent} from "../../landing/preloader.component";
import {LoadingService} from '../../services/shared/loading-service.service';


@Component({
    selector: 'app-admin-layout',
    imports: [RouterOutlet, AdminNavbarComponent, AdminFooterComponent, AdminSidebarComponent, PreloaderComponent, RouterModule],
    templateUrl: './admin-layout.component.html',
    styleUrl: './admin-layout.component.scss',
    encapsulation: ViewEncapsulation.None
})
export class AdminLayoutComponent implements OnInit {
   isLoading = false;
   private router = inject(Router);
   private loadingService = inject(LoadingService);
   private cdr = inject(ChangeDetectorRef);
   private document = inject(DOCUMENT);

   ngOnInit(): void {
      this.resetSidebarClasses();
      this.loadingService.isLoading$.subscribe(value => {
         // Use setTimeout to push change detection to the next cycle
         setTimeout(() => {
            this.isLoading = value;
            this.cdr.detectChanges(); // <-- Safely tell Angular to recheck
         });
      });
   }

   private resetSidebarClasses(): void {
      this.document.body.classList.remove('sidebar-open', 'sidebar-folded', 'open-sidebar-folded', 'settings-open');
   }
}
