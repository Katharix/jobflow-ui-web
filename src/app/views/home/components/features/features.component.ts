import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { Feature } from '../types';

@Component({
    selector: 'app-features',
    imports: [CommonModule],
    templateUrl: './features.component.html',
    styleUrl: './features.component.scss'
})
export class FeaturesComponent {
  featuresRow1: Feature[] = [
    { title: 'Job Scheduling & Dispatch', imgSrc: '/assets/public/images/features/fea-1.png' },
    { title: 'Estimates & Approvals', imgSrc: '/assets/public/images/features/fea-2.png' },
    { title: 'Invoices & Online Payments', imgSrc: '/assets/public/images/features/fea-3.png' },
    { title: 'Client Notifications', imgSrc: '/assets/public/images/features/fea-4.png' }
  ];

  featuresRow2: Feature[] = [
    { title: 'Crew Assignments', imgSrc: '/assets/public/images/features/fea-5.png' },
    { title: 'Pricebook & Services', imgSrc: '/assets/public/images/features/fea-6.png' },
    { title: 'Calendar Workflow', imgSrc: '/assets/public/images/features/fea-7.png' },
    { title: 'Business Insights', imgSrc: '/assets/public/images/features/fea-8.png' }
  ];
}
