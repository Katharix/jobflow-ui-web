import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../admin/dashboard/page-header/page-header.component';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SupportHubDataService } from '../../services/support-hub-data.service';
import { SupportHubAuditLog } from '../../models/support-hub-audit-log';

@Component({
  selector: 'app-support-hub-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, ButtonModule, SelectModule],
  templateUrl: './support-hub-audit-logs.component.html',
  styleUrl: './support-hub-audit-logs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubAuditLogsComponent implements OnInit {
  private dataService = inject(SupportHubDataService);
  private cdr = inject(ChangeDetectorRef);

  logs: SupportHubAuditLog[] = [];
  loading = false;
  nextCursor: string | null = null;

  categoryFilter = '';
  successFilter = '';
  categoryOptions = [
    { label: 'All categories', value: '' },
    { label: 'Authorization', value: 'Authorization' },
    { label: 'Authentication', value: 'Authentication' },
    { label: 'Payment', value: 'Payment' },
    { label: 'Application', value: 'Application' },
  ];
  successOptions = [
    { label: 'All results', value: '' },
    { label: 'Success', value: 'true' },
    { label: 'Failure', value: 'false' },
  ];

  expandedId: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(append = false): void {
    this.loading = true;
    const filters: Record<string, unknown> = { pageSize: 50 };
    if (append && this.nextCursor) filters['cursor'] = this.nextCursor;
    if (this.categoryFilter) filters['category'] = this.categoryFilter;
    if (this.successFilter) filters['success'] = this.successFilter === 'true';

    this.dataService.getAuditLogs(filters as never).subscribe({
      next: (res) => {
        this.logs = append ? [...this.logs, ...res.items] : res.items;
        this.nextCursor = res.nextCursor ?? null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilters(): void {
    this.nextCursor = null;
    this.load();
  }

  loadMore(): void {
    this.load(true);
  }

  toggleDetails(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  methodClass(method: string | null): string {
    switch (method?.toUpperCase()) {
      case 'GET': return 'sh-method--get';
      case 'POST': return 'sh-method--post';
      case 'PUT': case 'PATCH': return 'sh-method--put';
      case 'DELETE': return 'sh-method--delete';
      default: return '';
    }
  }

  statusClass(code: number): string {
    if (code >= 200 && code < 300) return 'sh-status--ok';
    if (code >= 400 && code < 500) return 'sh-status--warn';
    return 'sh-status--error';
  }
}
