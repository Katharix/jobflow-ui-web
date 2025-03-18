import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from "./landing/navigation/navbar/navbar.component";
import { FooterComponent } from "./landing/navigation/footer/footer.component";
import { HomeComponent } from "./landing/home/home.component";
import { PricingComponent } from "./landing/pricing/pricing.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, HomeComponent, PricingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'job-flow-ui-web';
}
