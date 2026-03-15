import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EstimateService } from '../../../admin/estimates/services/estimate.service';
import { Estimate, EstimateStatus, EstimateStatusLabels } from '../../../admin/estimates/models/estimate';

@Component({
  selector: 'app-estimate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estimate.component.html',
  styleUrl: './estimate.component.scss',
})
export class EstimateComponent implements OnInit {
  estimate?: Estimate;
  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private estimateService: EstimateService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('id');
    if (!token) {
      this.error = 'Invalid estimate link.';
      return;
    }

    this.loading = true;
    this.estimateService.getPublic(token).subscribe({
      next: (estimate) => {
        const payload = (estimate as any)?.data ?? estimate;
        this.estimate = payload as Estimate;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load this estimate. It may be expired or invalid.';
        this.loading = false;
      },
    });
  }

  get statusLabel(): string {
    if (!this.estimate) return '—';
    const raw = this.estimate.status as unknown;
    if (typeof raw === 'string' && raw.trim()) {
      return raw;
    }
    const value = typeof raw === 'number' ? raw : Number(raw);
    const status = isNaN(value) ? EstimateStatus.Draft : (value as EstimateStatus);
    return EstimateStatusLabels[status] ?? 'Unknown';
  }

  get displayDate(): string | null {
    if (!this.estimate) return null;
    return this.estimate.estimateDate ?? this.estimate.createdAt ?? null;
  }

  get organizationName(): string {
    return this.estimate?.organizationClient?.organization?.organizationName ?? '—';
  }

  get clientName(): string {
    const first = this.estimate?.organizationClient?.firstName ?? '';
    const last = this.estimate?.organizationClient?.lastName ?? '';
    return `${first} ${last}`.trim() || '—';
  }

  get lineItems() {
    return this.estimate?.lineItems ?? [];
  }

  get subtotal(): number {
    if (!this.estimate) return 0;
    if (typeof this.estimate.subtotal === 'number') return this.estimate.subtotal;
    return this.lineItems.reduce((sum, item) => {
      const lineTotal = typeof item.lineTotal === 'number'
        ? item.lineTotal
        : (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
      return sum + lineTotal;
    }, 0) ?? 0;
  }

  lineItemAmount(index: number): number {
    const item = this.lineItems[index];
    if (!item) return 0;
    if (typeof item.lineTotal === 'number') return item.lineTotal;
    return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }

  downloadPdf(): void {
    const token = this.route.snapshot.paramMap.get('id');
    if (!token) return;

    this.estimateService.getPublicPdf(token).subscribe({
      next: (blob) => {
        const fileName = `${this.estimate?.estimateNumber ?? 'estimate'}.pdf`;
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: () => {
        this.error = 'Unable to download estimate PDF.';
      },
    });
  }
}
