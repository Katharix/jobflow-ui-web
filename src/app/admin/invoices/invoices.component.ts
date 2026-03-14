import {Component, inject, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {Invoice, InvoiceStatus} from '../../models/invoice';
import {InvoiceService} from './services/invoice.service';
import {PageHeaderComponent} from '../../views/admin-views/dashboard/page-header/page-header.component';
import {JobflowGridColumn, JobflowGridComponent, JobflowGridPageSettings} from '../../common/jobflow-grid/jobflow-grid.component';
import {ToastService} from '../../common/toast/toast.service';

@Component({
   selector: 'app-invoices',
   standalone: true,
   imports: [
      CommonModule,
      PageHeaderComponent,
      JobflowGridComponent
   ],
   templateUrl: './invoices.component.html',
   styleUrl: './invoices.component.scss'
})
export class InvoicesComponent implements OnInit {

   @ViewChild('clientTemplate', {static: true})
   clientTemplate!: TemplateRef<any>;

   @ViewChild('statusTemplate', {static: true})
   statusTemplate!: TemplateRef<any>;

   @ViewChild('actionsTemplate', {static: true})
   actionsTemplate!: TemplateRef<any>;

   columns: JobflowGridColumn[] = [];
   items: Invoice[] = [];
   error: string | null = null;

   pageSettings: JobflowGridPageSettings = {
      pageSize: 20,
      pageSizes: [10, 20, 50, 100]
   };

   private toast = inject(ToastService);

   constructor(
      private invoiceService: InvoiceService,
      private router: Router
   ) {
   }

   ngOnInit(): void {
      this.buildColumns();
      this.load();
   }

   private buildColumns(): void {
      this.columns = [
         {
            field: 'invoiceNumber',
            headerText: 'Invoice #',
            width: 130
         },
         {
            headerText: 'Client',
            width: 220,
            template: this.clientTemplate
         },
         {
            field: 'invoiceDate',
            headerText: 'Invoice Date',
            width: 140,
            valueAccessor: (_field: string, data: Invoice) => this.formatDate(data.invoiceDate)
         },
         {
            field: 'dueDate',
            headerText: 'Due Date',
            width: 140,
            valueAccessor: (_field: string, data: Invoice) => this.formatDate(data.dueDate)
         },
         {
            field: 'totalAmount',
            headerText: 'Total',
            width: 120,
            textAlign: 'Right',
            valueAccessor: (_field: string, data: Invoice) => this.formatCurrency(data.totalAmount)
         },
         {
            field: 'balanceDue',
            headerText: 'Balance',
            width: 120,
            textAlign: 'Right',
            valueAccessor: (_field: string, data: Invoice) => this.formatCurrency(data.balanceDue)
         },
         {
            headerText: 'Status',
            width: 120,
            template: this.statusTemplate
         },
         {
            headerText: 'Actions',
            width: 120,
            template: this.actionsTemplate,
            textAlign: 'Right'
         }
      ];
   }

   load(): void {
      this.invoiceService.getByOrganization().subscribe({
         next: (list) => {
            this.items = (list ?? []).sort((left, right) => {
               const leftDate = new Date(left.invoiceDate).getTime();
               const rightDate = new Date(right.invoiceDate).getTime();
               return rightDate - leftDate;
            });
         },
         error: (e) => {
            this.error = 'Failed to load invoices.';
            this.toast.error('Failed to load invoices');
            console.error(e);
         }
      });
   }

   getClientName(invoice: Invoice): string {
      const firstName = invoice.organizationClient?.firstName?.trim() ?? '';
      const lastName = invoice.organizationClient?.lastName?.trim() ?? '';
      return `${firstName} ${lastName}`.trim() || '—';
   }

   getClientEmail(invoice: Invoice): string {
      return invoice.organizationClient?.emailAddress?.trim() || 'No email';
   }

   getStatusLabel(invoice: Invoice): string {
      const status = this.resolveStatus(invoice.status);

      switch (status) {
         case InvoiceStatus.Draft:
            return 'Draft';
         case InvoiceStatus.Sent:
            return 'Sent';
         case InvoiceStatus.Paid:
            return 'Paid';
         case InvoiceStatus.Overdue:
            return 'Overdue';
         case InvoiceStatus.Unpaid:
            return 'Unpaid';
         default:
            return 'Unknown';
      }
   }

   getStatusClass(invoice: Invoice): string {
      const status = this.resolveStatus(invoice.status);

      switch (status) {
         case InvoiceStatus.Draft:
            return 'status-draft';
         case InvoiceStatus.Sent:
            return 'status-sent';
         case InvoiceStatus.Paid:
            return 'status-paid';
         case InvoiceStatus.Overdue:
            return 'status-overdue';
         case InvoiceStatus.Unpaid:
            return 'status-unpaid';
         default:
            return 'status-unknown';
      }
   }

   openInvoice(invoice: Invoice): void {
      this.router.navigate(['/invoice/view', invoice.id]);
   }

   private resolveStatus(rawStatus: InvoiceStatus | number | string): InvoiceStatus | null {
      if (typeof rawStatus === 'number' && InvoiceStatus[rawStatus] !== undefined) {
         return rawStatus as InvoiceStatus;
      }

      if (typeof rawStatus === 'string') {
         const enumValue = InvoiceStatus[rawStatus as keyof typeof InvoiceStatus];
         if (typeof enumValue === 'number') {
            return enumValue;
         }

         const numericValue = Number(rawStatus);
         if (!Number.isNaN(numericValue) && InvoiceStatus[numericValue] !== undefined) {
            return numericValue as InvoiceStatus;
         }
      }

      return null;
   }

   private formatDate(value: string | null | undefined): string {
      if (!value) {
         return '—';
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
         return '—';
      }

      return date.toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric'
      });
   }

   private formatCurrency(value: number | null | undefined): string {
      const normalizedValue = Number(value ?? 0);
      return new Intl.NumberFormat('en-US', {
         style: 'currency',
         currency: 'USD'
      }).format(normalizedValue);
   }
}