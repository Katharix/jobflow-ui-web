import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { TranslateModule } from '@ngx-translate/core';

Chart.register(...registerables);

import {
  ReportingService, ReportDashboard,
  RevenueOverview, JobPerformance, EmployeeUtilization
} from './services/reporting.service';

type DateRange = '30d' | '90d' | '6m' | '1y' | 'custom';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, TranslateModule],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportingComponent implements OnInit, OnDestroy {
  private reportingService = inject(ReportingService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  loading = true;
  selectedRange: DateRange = '6m';
  dashboard: ReportDashboard | null = null;

  get avgJobValue(): number {
    if (!this.dashboard || this.dashboard.jobPerformance.totalJobs === 0) return 0;
    return this.dashboard.revenue.totalBilled / this.dashboard.jobPerformance.totalJobs;
  }
  // Revenue chart
  revenueChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  revenueChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Manrope' } } }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => '$' + Number(v).toLocaleString(), font: { family: 'Manrope' } }
      },
      x: { ticks: { font: { family: 'Manrope' } } }
    }
  };

  // Job trend chart
  jobTrendChartData: ChartData<'line'> = { labels: [], datasets: [] };
  jobTrendChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Manrope' } } }
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Manrope' } } },
      x: { ticks: { font: { family: 'Manrope' } } }
    }
  };

  // Employee utilization chart
  utilizationChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  utilizationChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Manrope' } } }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { callback: (v) => v + 'h', font: { family: 'Manrope' } }
      },
      y: { ticks: { font: { family: 'Manrope', size: 12 } } }
    }
  };

  // Job status doughnut
  jobStatusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  jobStatusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Manrope' } } }
    }
  };

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRangeChange(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading = true;
    const { start, end } = this.getDateRange();

    this.reportingService.getDashboard(start, end)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboard = data;
          this.buildRevenueChart(data.revenue);
          this.buildJobTrendChart(data.jobPerformance);
          this.buildUtilizationChart(data.employeeUtilization);
          this.buildJobStatusChart(data.jobPerformance);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private getDateRange(): { start: string; end: string } {
    const end = new Date();
    const start = new Date();

    switch (this.selectedRange) {
      case '30d': start.setDate(end.getDate() - 30); break;
      case '90d': start.setDate(end.getDate() - 90); break;
      case '6m': start.setMonth(end.getMonth() - 6); break;
      case '1y': start.setFullYear(end.getFullYear() - 1); break;
      default: start.setMonth(end.getMonth() - 6);
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  private buildRevenueChart(rev: RevenueOverview): void {
    const labels = rev.monthlyTrend.map(m => this.formatMonth(m.month));
    this.revenueChartData = {
      labels,
      datasets: [
        {
          label: 'Billed',
          data: rev.monthlyTrend.map(m => m.billed),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4
        },
        {
          label: 'Collected',
          data: rev.monthlyTrend.map(m => m.collected),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderRadius: 4
        }
      ]
    };
  }

  private buildJobTrendChart(perf: JobPerformance): void {
    const labels = perf.monthlyTrend.map(m => this.formatMonth(m.month));
    this.jobTrendChartData = {
      labels,
      datasets: [
        {
          label: 'Created',
          data: perf.monthlyTrend.map(m => m.created),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Completed',
          data: perf.monthlyTrend.map(m => m.completed),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    };
  }

  private buildUtilizationChart(employees: EmployeeUtilization[]): void {
    this.utilizationChartData = {
      labels: employees.map(e => e.employeeName),
      datasets: [
        {
          label: 'Scheduled Hours',
          data: employees.map(e => e.scheduledHours),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderRadius: 4
        },
        {
          label: 'Actual Hours',
          data: employees.map(e => e.actualHours),
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderRadius: 4
        }
      ]
    };
  }

  private buildJobStatusChart(perf: JobPerformance): void {
    this.jobStatusChartData = {
      labels: ['Draft', 'Booked', 'In Progress', 'Completed', 'Cancelled'],
      datasets: [{
        data: [
          perf.draftCount, perf.bookedCount, perf.inProgressCount,
          perf.completedCount, perf.cancelledCount
        ],
        backgroundColor: [
          '#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'
        ]
      }]
    };
  }

  private formatMonth(ym: string): string {
    const [year, month] = ym.split('-');
    const date = new Date(+year, +month - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  formatCurrency(value: number): string {
    return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatPercent(value: number): string {
    return value.toFixed(1) + '%';
  }
}
