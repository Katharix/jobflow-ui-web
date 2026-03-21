import {Component, ViewEncapsulation} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {PublicNavbarComponent} from "./public-navbar/public-navbar.component";
import {PublicFooterComponent} from "./public-footer/public-footer.component";
import {BackToTopComponent} from "../../landing/back-to-top.component";
import {PreloaderComponent} from "../../landing/preloader.component";

@Component({
   selector: 'app-public-layout',
   standalone: true,
   imports: [RouterOutlet, PublicNavbarComponent, PublicFooterComponent, BackToTopComponent, PreloaderComponent],
   templateUrl: './public-layout.component.html',
   styleUrl: './public-layout.component.scss',
   encapsulation: ViewEncapsulation.None
})
export class PublicLayoutComponent {

}
