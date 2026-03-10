import {Component, ViewEncapsulation, inject} from '@angular/core';
import {
   NavigationCancel,
   NavigationEnd, NavigationError, NavigationStart,
   Router,
   RouterOutlet
} from '@angular/router';
import {PreloaderComponent} from "../../landing/preloader.component";
import {LoadingService} from '../../services/loading-service.service';
import {CommonModule} from '@angular/common';

@Component({
   selector: 'app-auth-layout',
   standalone: true,
   imports: [RouterOutlet, CommonModule, PreloaderComponent],
   templateUrl: './auth-layout.component.html',
   styleUrl: './auth-layout.component.scss',
   encapsulation: ViewEncapsulation.None
})
export class AuthLayoutComponent {
   private router = inject(Router);
   private loadingService = inject(LoadingService);

   isLoading$ = this.loadingService.isLoading$;

   constructor() {
      this.router.events.subscribe(event => {

         if (event instanceof NavigationStart) {
            this.loadingService.show();
         }

         if (
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
         ) {
            this.loadingService.hide();
         }
      });
   }
}
