import { Component } from '@angular/core';
import { PreloaderComponent } from "../../landing/preloader.component";
import { PublicNavbarComponent } from "../../layouts/public-layout/public-navbar/public-navbar.component";
import { HeroComponent } from "./components/hero/hero.component";
import { FeaturesComponent } from "./components/features/features.component";
import { CtaComponent } from "./components/cta/cta.component";
import { PricingComponent } from "./components/pricing/pricing.component";
import { ContactComponent } from "./components/contact/contact.component";
import { PublicFooterComponent } from "../../layouts/public-layout/public-footer/public-footer.component";
import { BackToTopComponent } from "../../landing/back-to-top.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, FeaturesComponent, CtaComponent, PricingComponent, ContactComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
