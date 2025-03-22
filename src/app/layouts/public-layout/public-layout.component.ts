import { Component } from '@angular/core';
import { NavbarComponent } from "../../landing/navigation/navbar/navbar.component";
import { HomeComponent } from "../../landing/home/home.component";
import { PricingComponent } from "../../landing/pricing/pricing.component";
import { FooterComponent } from "../../landing/navigation/footer/footer.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet,NavbarComponent, HomeComponent, PricingComponent, FooterComponent],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent {

}
