import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../dashboard/page-header/page-header.component';

type TransactionStatus = 'Paid' | 'Pending' | 'Refunded' | 'Failed';

interface PaymentTransaction {
  date: string;
  customer: string;
  reference: string;
  amount: number;
  fees: number;
  net: number;
  provider: 'Stripe' | 'Square';
  status: TransactionStatus;
}

@Component({
  selector: 'app-billing-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  templateUrl: './billing-payments.component.html',
  styleUrl: './billing-payments.component.scss'
})
export class BillingPaymentsComponent {
  readonly transactions: PaymentTransaction[] = [
    {
      date: '2026-03-12',
      customer: 'Acme Construction',
      reference: 'INV-1042',
      amount: 1260,
      fees: 39.12,
      net: 1220.88,
      provider: 'Stripe',
      status: 'Paid'
    },
    {
      date: '2026-03-10',
      customer: 'Bluebird Realty',
      reference: 'INV-1039',
      amount: 540,
      fees: 16.74,
      net: 523.26,
      provider: 'Square',
      status: 'Pending'
    },
    {
      date: '2026-03-08',
      customer: 'Glenwood HOA',
      reference: 'INV-1034',
      amount: 325,
      fees: 10.08,
      net: 314.92,
      provider: 'Stripe',
      status: 'Refunded'
    }
  ];

  get totalOutstanding(): number {
    return 1430;
  }

  get overdueInvoices(): number {
    return 3;
  }

  get upcomingPayout(): number {
    return 1744.14;
  }

  getStatusClass(status: TransactionStatus): string {
    switch (status) {
      case 'Paid':
        return 'badge bg-success';
      case 'Pending':
        return 'badge bg-warning text-dark';
      case 'Refunded':
        return 'badge bg-info text-dark';
      case 'Failed':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
