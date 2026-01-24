import {Component, ViewEncapsulation, inject} from '@angular/core';
import {RouteConfigLoadEnd, RouteConfigLoadStart, Router, RouterOutlet} from '@angular/router';
import {PreloaderComponent} from "../../landing/preloader.component";
import {LoadingService} from '../../services/loading-service.service';
import {CommonModule} from '@angular/common';
import {Observable} from 'rxjs';
import {LoadingOverlayComponent} from "../../common/app-loading-overlay/app-loading-overlay.component";

@Component({
   selector: 'app-auth-layout',
   standalone: true,
   imports: [RouterOutlet, CommonModule, PreloaderComponent, LoadingOverlayComponent],
   templateUrl: './auth-layout.component.html',
   styleUrl: './auth-layout.component.scss',
   encapsulation: ViewEncapsulation.None
})
export class AuthLayoutComponent {
   private loadingService = inject(LoadingService);
   isLoading$: Observable<boolean> = this.loadingService.isLoading$;
}
