import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from "./admin-sidebar/admin-sidebar.component";
import { AdminNavbarComponent } from './admin-navbar/admin-navbar.component';
import { AdminFooterComponent } from './admin-footer/admin-footer.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet,AdminNavbarComponent, AdminFooterComponent, AdminSidebarComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
  encapsulation: ViewEncapsulation.None 
})
export class AdminLayoutComponent implements OnInit {
  isLoading: boolean = false;
  private router = inject(Router);

  constructor() {}

  ngOnInit(): void {
    // Spinner for lazy loading modules/components
    this.router.events.forEach((event) => { 
      if (event instanceof RouteConfigLoadStart) {
        this.isLoading = true;
      } else if (event instanceof RouteConfigLoadEnd) {
        this.isLoading = false;
      }
    });
  }
}
