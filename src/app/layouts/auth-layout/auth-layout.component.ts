import { Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';
import { LoginComponent } from "../../views/admin-views/auth/login/login.component";
import { PreloaderComponent } from "../../landing/preloader.component";

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, LoginComponent, PreloaderComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AuthLayoutComponent implements OnInit {

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