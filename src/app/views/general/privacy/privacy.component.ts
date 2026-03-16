import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss'
})
export class PrivacyComponent {
  lastUpdated = 'March 22, 2025';
  companyName = 'JobFlow';
  legalEntity = 'Katharix, LLC';
  contactEmail = 'hello@katharix.com';
  businessAddress = '2027 White Lake Dr, Fredericksburg, VA, 22407';
  jurisdiction = 'Virginia, USA';
}
