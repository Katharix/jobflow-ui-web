import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { Feature } from '../types';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss'
})
export class FeaturesComponent {
  featuresRow1: Feature[] = [
    { title: 'Client & Crew Management', imgSrc: '/assets/public/images/features/fea-1.png' },
    { title: 'Reporting', imgSrc: '/assets/public/images/features/fea-2.png' },
    { title: 'Client & Crew Communication', imgSrc: '/assets/public/images/features/fea-3.png' },
    { title: 'Email & Text Nofications', imgSrc: '/assets/public/images/features/fea-4.png' }
  ];

  featuresRow2: Feature[] = [
    { title: 'Easy Customize', imgSrc: '/assets/public/images/features/fea-5.png' },
    { title: 'Manage Workflow', imgSrc: '/assets/public/images/features/fea-6.png' },
    { title: 'Scheduling', imgSrc: '/assets/public/images/features/fea-7.png' },
    { title: 'Growth', imgSrc: '/assets/public/images/features/fea-8.png' }
  ];
}
