import {Component} from '@angular/core';

import {FormsModule} from '@angular/forms';
import {AccordionModule} from 'primeng/accordion';
import {InputTextModule} from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {PageHeaderComponent} from '../dashboard/page-header/page-header.component';

interface HelpFaqItem {
   category: 'Billing' | 'Clients' | 'Jobs' | 'Branding' | 'Support';
   question: string;
   answer: string;
   keywords: string[];
}

@Component({
    selector: 'app-help',
    imports: [FormsModule, AccordionModule, InputTextModule, ButtonModule, TagModule, PageHeaderComponent],
    templateUrl: './help.component.html',
    styleUrl: './help.component.scss'
})
export class HelpComponent {
   searchTerm = '';

   readonly faqs: HelpFaqItem[] = [
      {
         category: 'Billing',
         question: 'How do I create a new invoice?',
         answer: 'Open Company > Jobs, select the job, and choose the invoice action. All generated invoices are also available in Company > Invoicing.',
         keywords: ['invoice', 'invoicing', 'billing', 'create']
      },
      {
         category: 'Billing',
         question: 'Where can I see all invoices for my organization?',
         answer: 'Go to Company > Invoicing. That page shows invoices for your organization with search and paging support.',
         keywords: ['invoice', 'billing', 'organization', 'list']
      },
      {
         category: 'Clients',
         question: 'How do I add clients before invoicing?',
         answer: 'Use the Clients page in the sidebar. Create or update the client first so invoices can link to the correct client profile.',
         keywords: ['client', 'customer', 'invoice', 'create']
      },
      {
         category: 'Billing',
         question: 'Why does an invoice show Draft or Unpaid?',
         answer: 'Draft means the invoice is created but not finalized. Unpaid means it is issued and still waiting for payment.',
         keywords: ['invoice', 'draft', 'unpaid', 'status']
      },
      {
         category: 'Branding',
         question: 'How do I update branding on invoices?',
         answer: 'Go to Company > Settings > Branding to update logo, business details, and invoice presentation settings.',
         keywords: ['branding', 'invoice', 'settings', 'logo']
      },
      {
         category: 'Support',
         question: 'How do I contact support?',
         answer: 'Use your usual support channel for your environment. Include organization name, user email, and screenshots for faster resolution.',
         keywords: ['support', 'contact', 'help', 'issue']
      }
   ];

   get filteredFaqs(): HelpFaqItem[] {
      const query = this.searchTerm.trim().toLowerCase();
      if (!query) {
         return this.faqs;
      }

      return this.faqs.filter((faq) => {
         const searchable = [faq.category, faq.question, faq.answer, ...faq.keywords]
            .join(' ')
            .toLowerCase();
         return searchable.includes(query);
      });
   }

   get resultCount(): number {
      return this.filteredFaqs.length;
   }

   clearSearch(): void {
      this.searchTerm = '';
   }

   getCategorySeverity(category: HelpFaqItem['category']): 'secondary' | 'info' | 'success' | 'warn' {
      switch (category) {
         case 'Billing':
            return 'info';
         case 'Clients':
            return 'success';
         case 'Branding':
            return 'warn';
         default:
            return 'secondary';
      }
   }
}