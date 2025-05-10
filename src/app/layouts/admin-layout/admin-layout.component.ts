import { ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from "./admin-sidebar/admin-sidebar.component";
import { AdminNavbarComponent } from './admin-navbar/admin-navbar.component';
import { AdminFooterComponent } from './admin-footer/admin-footer.component';
import { PreloaderComponent } from "../../landing/preloader.component";
import { LoadingService } from '../../services/loading-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, AdminNavbarComponent, AdminFooterComponent, AdminSidebarComponent, PreloaderComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdminLayoutComponent implements OnInit {
  isLoading: boolean = false;
  private router = inject(Router);
  private loadingService = inject(LoadingService);
   private cdr = inject(ChangeDetectorRef);
  constructor() { }

  ngOnInit(): void {
    this.loadingService.isLoading$.subscribe(value => {
      // Use setTimeout to push change detection to the next cycle
      setTimeout(() => {
        this.isLoading = value;
        this.cdr.detectChanges(); // <-- Safely tell Angular to recheck
      });
    });
  }
}
