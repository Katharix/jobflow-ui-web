import { credits, currentYear } from '../../../common/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

type FooterLink = {
  label: string;
  href?: string;
  routerLink?: string;
};

type FooterLinkGroup = {
  title: string;
  links: FooterLink[];
};

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './public-footer.component.html',
  styleUrl: './public-footer.component.scss'
})
export class PublicFooterComponent {
  currentYear = currentYear;
  credits = credits;

  footerLinkGroups: FooterLinkGroup[] = [
    {
      title: 'Product',
      links: [
        { label: 'Scheduling & Dispatch', href: '#features' },
        { label: 'Estimates', href: '#features' },
        { label: 'Invoices & Payments', href: '#features' },
        { label: 'Pricing', href: '#pricing' },
      ],
    },
    {
      title: 'Who It\'s For',
      links: [
        { label: 'Contractors', href: '#about' },
        { label: 'Landscaping Teams', href: '#about' },
        { label: 'Painting Crews', href: '#about' },
        { label: 'Home Service Businesses', href: '#about' },
      ],
    },
    {
      title: 'Get Started',
      links: [
        { label: 'See Plans', href: '#pricing' },
        { label: 'Contact Sales', href: '#contact' },
        { label: 'Sign In', routerLink: '/auth/login' },
        { label: 'Subscribe', href: '#contact' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About Job Flow', href: '#about' },
        { label: 'Terms & Conditions', routerLink: '/terms' },
        { label: 'Privacy Policy', routerLink: '/privacy' },
      ],
    },
  ];
}
