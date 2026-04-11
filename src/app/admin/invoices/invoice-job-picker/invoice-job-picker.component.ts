import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Job } from '../../jobs/models/job';

export interface InvoiceJobPickerRow {
   id: string;
   job: Job;
   title: string;
   clientName: string;
   scheduledDateText: string;
   scheduledDateShort: string;
   statusClass: string;
   statusLabel: string;
}

@Component({
   selector: 'app-invoice-job-picker',
   standalone: true,
   imports: [CommonModule, RouterModule, TranslateModule],
   templateUrl: './invoice-job-picker.component.html',
   styleUrl: './invoice-job-picker.component.scss',
   changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceJobPickerComponent {
   @Input() rows: readonly InvoiceJobPickerRow[] = [];
   @Input() hasJobSearchTerm = false;
   @Input() jobPickerError: string | null = null;
   @Input() returnToCommandCenter = false;

   @Output() selectJob = new EventEmitter<Job>();

   trackByRowId(_index: number, row: InvoiceJobPickerRow): string {
      return row.id;
   }
}
