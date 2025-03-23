import { credits, currentYear } from '../../../common/constants';
import { Component } from '@angular/core';

type FooterLinkType = {
  title: string,
  links: string[]

}
@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [],
  templateUrl: './public-footer.component.html',
  styleUrl: './public-footer.component.scss'
})
export class PublicFooterComponent {
  currentYear = currentYear
  credits = credits

  footerLinks: FooterLinkType[] = [
    {
      title: "Solution",
      links: [
        "Enterprise",
        "By Workflow",
        "By Team"
      ]
    },
    {
      title: "Company",
      links: [
        "About Us",
        "News & Press",
        "Our Customer",
        "Leadership",
        "Careers"
      ]
    },
    {
      title: "Resources",
      links: [
        "Blog",
        "Webinar & Events",
        "Podcast",
        "E-book & Guides"
      ]
    },
    {
      title: "Contact Us",
      links: [
        "Contact Sales",
        "Become Partner",
        "Affiliate Program"
      ]
    }
  ]
}
