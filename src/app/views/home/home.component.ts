import { Component } from '@angular/core';
import { HeroComponent } from "./components/hero/hero.component";
import { FeaturesComponent } from "./components/features/features.component";
import { CtaComponent } from "./components/cta/cta.component";
import { PricingComponent } from "./components/pricing/pricing.component";
import { ContactComponent } from "./components/contact/contact.component";
import { AboutComponent } from "./components/about/about.component";
import { HowItWorksComponent } from "./components/how-it-works/how-it-works.component";

@Component({
    selector: 'app-home',
    imports: [HeroComponent, FeaturesComponent, CtaComponent, PricingComponent, ContactComponent, AboutComponent, HowItWorksComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {

}
