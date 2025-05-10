import { ChangeDetectorRef, Component, inject, OnInit, ViewEncapsulation } from '@angular/core';
import { RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterOutlet } from '@angular/router';
import { LoginComponent } from "../../views/admin-views/auth/login/login.component";
import { PreloaderComponent } from "../../landing/preloader.component";
import { LoadingService } from '../../services/loading-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, LoginComponent, PreloaderComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AuthLayoutComponent implements OnInit {

  isLoading: boolean = false;
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private cdr = inject(ChangeDetectorRef);
  constructor() {}

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