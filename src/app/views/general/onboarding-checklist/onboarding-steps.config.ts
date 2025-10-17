import { WizardStep } from '../../../common/wizard/wizard-step';
import { TemplateRef } from '@angular/core';
import { MovingDirection } from '@rg-software/angular-archwizard';

export function getOnboardingSteps(templates: {
  step1: TemplateRef<any>,
  step2: TemplateRef<any>,
  step3: TemplateRef<any>,
  step4: TemplateRef<any>,
  step5: TemplateRef<any>,
  step6: TemplateRef<any>,
}): WizardStep[] {
  return [
    {
      title: 'Connect Your Payment Account',
      description: '(Link your Stripe or Square account to accept payments.)',
      canExit: () => true,
      contentTemplate: templates.step1
    },
    {
      title: 'Customize Your Branding',
      description: '(Add your logo, company colors, tagline, and footer details.)',
      contentTemplate: templates.step2
    },
    {
      title: 'Set Up Sales Tax',
      canEnter: (direction: MovingDirection) => Promise.resolve(true),
      description: '(Enter your tax rate and choose whether to charge tax.)',
      contentTemplate: templates.step3
    },
    {
      title: 'Connect to QuickBooks (optional)',
      description: '(Securely link your QuickBooks account for easy syncing.)',
      contentTemplate: templates.step4
    },
    {
      title: 'Import Your QuickBooks Data',
      description: '(Pull in your clients, employees, addresses, and more.)',
      contentTemplate: templates.step5
    },
    {
      title: 'Add Employees Manually (if needed)',
      description: '(Create your team inside Job Flow if not using QuickBooks.)',
      contentTemplate: templates.step6
    }
  ];
}
