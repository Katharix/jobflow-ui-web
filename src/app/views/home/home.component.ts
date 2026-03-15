import { Component } from '@angular/core';
import { HeroComponent } from "./components/hero/hero.component";
import { FeaturesComponent } from "./components/features/features.component";
import { CtaComponent } from "./components/cta/cta.component";
import { PricingComponent } from "./components/pricing/pricing.component";
import { ContactComponent } from "./components/contact/contact.component";
import { AboutComponent } from "./components/about/about.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, FeaturesComponent, CtaComponent, PricingComponent, ContactComponent, AboutComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
