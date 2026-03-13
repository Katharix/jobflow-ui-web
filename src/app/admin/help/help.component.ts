import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PageHeaderComponent} from '../../views/admin-views/dashboard/page-header/page-header.component';

interface HelpFaqItem {
   question: string;
   answer: string;
}

@Component({
   selector: 'app-help',
   standalone: true,
   imports: [CommonModule, PageHeaderComponent],
   templateUrl: './help.component.html',
   styleUrl: './help.component.scss'
})
export class HelpComponent {
   readonly faqs: HelpFaqItem[] = [
      {
         question: 'How do I create a new invoice?',
         answer: 'Go to Company > Jobs, open a job, then use the invoice action. You can also view all generated invoices in Company > Invoicing.'
      },
      {
         question: 'Where can I see all invoices for my organization?',
         answer: 'Open Company > Invoicing. The page lists all invoices returned by your organization endpoint and supports searching and paging.'
      },
      {
         question: 'How do I add clients before invoicing?',
         answer: 'Use the Clients page from the sidebar. Create or update the client first so invoice records can link to that client profile.'
      },
      {
         question: 'Why does an invoice show Draft or Unpaid?',
         answer: 'Draft means it was created but not finalized for payment. Unpaid means it has been issued but no payment has been recorded yet.'
      },
      {
         question: 'How do I update branding on invoices?',
         answer: 'Go to Company > Settings > Branding to update your organization details and invoice presentation settings.'
      },
      {
         question: 'How do I contact support?',
         answer: 'Use your normal support channel for your environment. Include organization name, user email, and screenshots when possible for faster help.'
      }
   ];
}