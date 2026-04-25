import { Injectable } from '@angular/core';
import { driver, DriveStep } from 'driver.js';

const STEP_WALKTHROUGHS: Record<string, DriveStep[]> = {
  choose_track: [
    {
      element: '[data-tour="quick-start-tracks"]',
      popover: {
        title: 'Choose Your Path',
        description: 'Select the onboarding track that best describes your business.',
        side: 'bottom',
      },
    },
  ],
  choose_industry_preset: [
    {
      element: '[data-tour="quick-start-presets"]',
      popover: {
        title: 'Industry Presets',
        description: 'Pick a preset to populate your pricebook with suggested services for your trade.',
        side: 'bottom',
      },
    },
  ],
  setup_company: [
    {
      element: '[data-tour="company-name"]',
      popover: {
        title: 'Company Name',
        description: 'Enter your business name — it appears on all invoices and estimates.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="company-address"]',
      popover: {
        title: 'Business Address',
        description: 'Your address is printed on client-facing documents.',
        side: 'bottom',
      },
    },
  ],
  create_customer: [
    {
      element: '[data-tour="client-name"]',
      popover: {
        title: 'Client Name',
        description: 'Enter the full name or company name of your first client.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="client-email"]',
      popover: {
        title: 'Client Email',
        description: 'Used to send estimates, invoices, and job updates.',
        side: 'bottom',
      },
    },
  ],
  create_job: [
    {
      element: '[data-tour="job-title"]',
      popover: {
        title: 'Job Title',
        description: 'Give the job a clear title so you can find it quickly.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="job-client"]',
      popover: {
        title: 'Assign a Client',
        description: 'Link this job to a client to keep everything organized.',
        side: 'bottom',
      },
    },
  ],
  schedule_job: [
    {
      element: '[data-tour="calendar-grid"]',
      popover: {
        title: 'Schedule a Job',
        description: 'Click a time slot on the calendar to schedule your job.',
        side: 'right',
      },
    },
  ],
  create_invoice: [
    {
      element: '[data-tour="invoice-client"]',
      popover: {
        title: 'Select Client',
        description: 'Choose the client you want to invoice.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="invoice-line-items"]',
      popover: {
        title: 'Line Items',
        description: 'Add services or items from your pricebook.',
        side: 'bottom',
      },
    },
  ],
  connect_stripe: [
    {
      element: '[data-tour="stripe-connect-btn"]',
      popover: {
        title: 'Connect Stripe',
        description: "Click here to link your Stripe account and start accepting payments online.",
        side: 'bottom',
      },
    },
  ],
  send_invoice: [
    {
      element: '[data-tour="invoice-send-btn"]',
      popover: {
        title: 'Send Invoice',
        description: "Use the Send button to email the invoice directly to your client.",
        side: 'left',
      },
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class WalkthroughService {
  startWalkthrough(stepKey: string): void {
    const steps = STEP_WALKTHROUGHS[stepKey];
    if (!steps?.length) return;

    const driverObj = driver({
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: 0.35,
      stagePadding: 6,
      popoverClass: 'jf-tour-popover',
      steps,
    });

    driverObj.drive();
  }

  hasWalkthrough(stepKey: string): boolean {
    return stepKey in STEP_WALKTHROUGHS;
  }
}
