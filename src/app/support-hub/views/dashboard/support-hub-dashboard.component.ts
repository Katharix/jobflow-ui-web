import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../../admin/dashboard/page-header/page-header.component';
import { ButtonModule } from 'primeng/button';

interface SupportMetric {
  label: string;
  value: string;
  trend: string;
}

@Component({
  selector: 'app-support-hub-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, ButtonModule],
  templateUrl: './support-hub-dashboard.component.html',
  styleUrl: './support-hub-dashboard.component.scss',
})
export class SupportHubDashboardComponent {
  readonly metrics: SupportMetric[] = [
    { label: 'Active sessions', value: '12', trend: '+3 in last hour' },
    { label: 'Open tickets', value: '48', trend: '6 urgent' },
    { label: 'Orgs monitored', value: '132', trend: '98% healthy' },
    { label: 'Avg response', value: '4m', trend: 'On target' },
  ];
}
