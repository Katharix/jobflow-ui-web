import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface ComprehensiveWorkflowStep {
   step: string;
   title: string;
   description: string;
   metric: string;
   ctaLabel: string;
   route: string;
   queryParams?: Record<string, string>;
   status: 'ready' | 'attention' | 'clear';
}

@Component({
   selector: 'app-dashboard-comprehensive-workflow',
   standalone: true,
   imports: [CommonModule, RouterModule],
   templateUrl: './comprehensive-workflow.component.html',
   styleUrl: './comprehensive-workflow.component.scss'
})
export class ComprehensiveWorkflowComponent {
   @Input() flowSteps: ComprehensiveWorkflowStep[] = [];

   getFlowStepStatusClass(step: ComprehensiveWorkflowStep): string {
      return `workflow-step workflow-step--${step.status}`;
   }

   getFlowStepStatusLabel(step: ComprehensiveWorkflowStep): string {
      switch (step.status) {
         case 'ready':
            return 'Ready';
         case 'attention':
            return 'Needs attention';
         default:
            return 'Clear';
      }
   }
}
