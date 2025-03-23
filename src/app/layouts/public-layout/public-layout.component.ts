import { Component, ViewEncapsulation } from '@angular/core';
import { HomeComponent } from "../../landing/home/home.component";
import { PricingComponent } from "../../landing/pricing/pricing.component";
import { RouterOutlet } from '@angular/router';
import { PublicNavbarComponent } from "./public-navbar/public-navbar.component";
import { PublicFooterComponent } from "./public-footer/public-footer.component";
import { BackToTopComponent } from "../../landing/back-to-top.component";
import { PreloaderComponent } from "../../landing/preloader.component";

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
